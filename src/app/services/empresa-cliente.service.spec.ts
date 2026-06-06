import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmpresaClienteService } from './empresa-cliente.service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/empresas-clientes`;

describe('EmpresaClienteService', () => {
  let service: EmpresaClienteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmpresaClienteService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmpresaClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll hace GET con query params', () => {
    service.getAll({ page: 1, search: 'acme' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('acme');
    req.flush({ data: [], total: 0, page: 1, totalPages: 0 });
  });

  it('create hace POST', () => {
    service.create({ cuit: '20-12345678-6' }).subscribe();
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'c1' });
  });

  it('consultarCuit pega al endpoint correcto', () => {
    service.consultarCuit('20-12345678-6').subscribe();
    const req = httpMock.expectOne(`${BASE}/consultar-cuit/20-12345678-6`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
