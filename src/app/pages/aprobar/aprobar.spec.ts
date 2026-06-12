import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { AprobarComponent } from './aprobar';
import { AprobacionService } from '../../services/aprobacion.service';

const TOKEN = 'SUPER-SECRET-MAGIC-LINK-TOKEN.abc-123';

function makeRoute(opts: { fragment?: string | null; query?: Record<string, string> }) {
  const query = opts.query ?? {};
  return {
    snapshot: {
      fragment: opts.fragment ?? null,
      queryParamMap: {
        get: (k: string) => (k in query ? query[k] : null),
      },
    },
  } as unknown as ActivatedRoute;
}

function setup(route: ActivatedRoute, getContexto = vi.fn(() => of({} as any))) {
  const aprobacionService = {
    getContextoToken: getContexto,
    decidirViaToken: vi.fn(() => of({ mensaje: 'ok', estadoAprobacion: 'aprobada' })),
  };
  TestBed.configureTestingModule({
    providers: [
      AprobarComponent,
      { provide: ActivatedRoute, useValue: route },
      { provide: AprobacionService, useValue: aprobacionService },
      { provide: Meta, useValue: { addTag: vi.fn() } },
    ],
  });
  const component = TestBed.inject(AprobarComponent);
  return { component, aprobacionService };
}

describe('AprobarComponent (regresión: token de magic-link fuera de la URL)', () => {
  let replaceStateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    replaceStateSpy = vi.fn();
    vi.spyOn(history, 'replaceState').mockImplementation(replaceStateSpy as any);
  });

  afterEach(() => vi.restoreAllMocks());

  it('lee el token desde el FRAGMENTO (#) — nunca llega al servidor en la URL', () => {
    const { component, aprobacionService } = setup(
      makeRoute({ fragment: `t=${TOKEN}&decision=aprobar` }),
    );
    component.ngOnInit();

    expect(aprobacionService.getContextoToken).toHaveBeenCalledWith(TOKEN);
    expect(component.decision()).toBe('aprobar');
  });

  it('limpia la barra de direcciones (replaceState a pathname) tras leer el token', () => {
    const { component } = setup(makeRoute({ fragment: `t=${TOKEN}` }));
    component.ngOnInit();

    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    const urlArg = replaceStateSpy.mock.calls[0][2] as string;
    // La nueva URL NO debe contener el token ni un fragmento.
    expect(urlArg).not.toContain(TOKEN);
    expect(urlArg).not.toContain('#');
    expect(urlArg).toBe(location.pathname);
  });

  it('prioriza el fragmento sobre el query param ?t= cuando ambos están presentes', () => {
    const { component, aprobacionService } = setup(
      makeRoute({ fragment: `t=${TOKEN}`, query: { t: 'TOKEN-VIEJO-DE-QUERY' } }),
    );
    component.ngOnInit();
    expect(aprobacionService.getContextoToken).toHaveBeenCalledWith(TOKEN);
  });

  it('cae al query param ?t= solo por compatibilidad (links ya emitidos) y también lo limpia', () => {
    const { component, aprobacionService } = setup(
      makeRoute({ fragment: null, query: { t: TOKEN } }),
    );
    component.ngOnInit();
    expect(aprobacionService.getContextoToken).toHaveBeenCalledWith(TOKEN);
    // Aún en el path de compatibilidad, el token se borra de la URL.
    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
  });

  it('sin token: muestra error y NO llama al backend ni toca la URL', () => {
    const { component, aprobacionService } = setup(makeRoute({ fragment: null, query: {} }));
    component.ngOnInit();

    expect(aprobacionService.getContextoToken).not.toHaveBeenCalled();
    expect(replaceStateSpy).not.toHaveBeenCalled();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('propaga error de contexto a la UI (token inválido/expirado)', () => {
    const getContexto = vi.fn(() => throwError(() => new Error('401')));
    const { component } = setup(makeRoute({ fragment: `t=${TOKEN}` }), getContexto);
    component.ngOnInit();

    expect(component.error()).toContain('Token inválido o expirado');
    expect(component.loading()).toBe(false);
  });
});
