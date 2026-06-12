import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AprobacionService } from './aprobacion.service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/aprobaciones`;

// Token de magic-link de ejemplo (base64url) usado para verificar que NUNCA
// termina embebido en la URL de la request de contexto.
const TOKEN = 'eyJhbGciOi.SUPER-SECRET-MAGIC-LINK-TOKEN.payload_abc-123';

describe('AprobacionService', () => {
  let service: AprobacionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AprobacionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AprobacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getContextoToken (regresión: token de magic-link NO en la URL)', () => {
    it('hace POST a /contexto-token (sin token en el path)', () => {
      service.getContextoToken(TOKEN).subscribe();
      const req = httpMock.expectOne(`${BASE}/contexto-token`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('envía el token en el BODY, no en la URL ni en los query params', () => {
      service.getContextoToken(TOKEN).subscribe();
      const req = httpMock.expectOne(`${BASE}/contexto-token`);

      // El ataque: el token viajaba en el PATH del GET y quedaba en access logs,
      // historial y Referer. Ahora viaja en el body de un POST.
      expect(req.request.body).toEqual({ token: TOKEN });

      // La URL completa (path + query) NO debe contener el token bajo ninguna forma.
      expect(req.request.urlWithParams).not.toContain(TOKEN);
      expect(req.request.urlWithParams).not.toContain(encodeURIComponent(TOKEN));
      expect(req.request.url).not.toContain(TOKEN);
      expect(req.request.params.keys().length).toBe(0);

      req.flush({});
    });

    it('ya NO existe ningún GET con el token en el path (cierre del ataque)', () => {
      service.getContextoToken(TOKEN).subscribe();

      // Si alguien reintrodujera el GET /contexto-token/:token, esto fallaría
      // porque el request real es un POST a /contexto-token.
      httpMock.expectNone(`${BASE}/contexto-token/${encodeURIComponent(TOKEN)}`);
      httpMock.expectNone((r) => r.method === 'GET' && r.url.includes('contexto-token'));

      const req = httpMock.expectOne(`${BASE}/contexto-token`);
      req.flush({});
    });
  });

  describe('decidirViaToken (sigue mandando el token en el body — sin regresión)', () => {
    it('hace POST con el token en el body, no en la URL', () => {
      service.decidirViaToken(TOKEN, 'aprobar', 'ok').subscribe();
      const req = httpMock.expectOne(`${BASE}/decidir-via-token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: TOKEN, decision: 'aprobar', comentario: 'ok' });
      expect(req.request.url).not.toContain(TOKEN);
      req.flush({ mensaje: 'ok', estadoAprobacion: 'aprobada' });
    });
  });
});
