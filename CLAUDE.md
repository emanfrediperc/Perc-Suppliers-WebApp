# Perc Suppliers WebApp

Frontend Angular 21 standalone con signals. UI glassmorphism custom, sin frameworks CSS externos.

## Stack

- **Framework**: Angular 21.1 (standalone components, NO NgModules)
- **State**: Angular Signals (`signal()`, `computed()`, `input()`, `output()`) — sin NgRx
- **Styling**: SCSS custom con design system propio (glassmorphism). Ver `BRAND_MANUAL.md`
- **Builder**: `@angular/build:application` (Vite-based)
- **TypeScript**: 5.9
- **Testing**: Vitest
- **Locale**: es-AR registrado globalmente

## Comandos

```bash
npm start             # ng serve en puerto 4200 (proxy /api -> localhost:3100)
npm run build         # ng build produccion -> dist/
npm run watch         # ng build --watch development
npm test              # Vitest
```

## Estructura de src/app/

```
app/
├── app.config.ts          # Providers: router, http, interceptors, locale es-AR
├── app.routes.ts          # Lazy-loaded routes con guards
├── guards/                # authGuard (functional), roleGuard (factory)
├── layout/                # MainLayout + Sidebar
├── models/                # Interfaces TypeScript (barrel en index.ts)
├── pages/
│   ├── login/ + register/
│   ├── dashboard/
│   ├── facturas/          # list + detail + upload-modal + pago-modal
│   ├── ordenes-pago/      # list + detail
│   ├── convenios/         # list + detail + form-modal
│   ├── empresas-proveedoras/ + empresas-clientes/
│   ├── aprobaciones/
│   ├── pagos-programados/
│   ├── estado-cuenta/
│   ├── reportes/
│   └── admin/             # usuarios/ + audit-logs/
├── services/              # 1 servicio por dominio + auth + theme + export + error
├── shared/                # Componentes reutilizables (ver abajo)
└── pipes/                 # cuitFormat, arsCurrency, dateAr
```

## Convenciones criticas

### Componentes
- **Standalone SIEMPRE**. Nunca crear NgModules. Usar `imports: []` en `@Component`
- **Nombres de archivo**: sin sufijo `.component` → `facturas-list.ts`, no `facturas-list.component.ts`
- **Signals-first**: usar `signal()`, `computed()`, `input()`, `output()` — NUNCA `@Input`/`@Output` ni `BehaviorSubject`
- **Lazy loading**: todas las rutas usan `loadComponent`

### Styling (LEER BRAND_MANUAL.md)
- **Tokens CSS obligatorios**: `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)` — NUNCA valores crudos
- **Glass components**: cards usan `.card-glass`, modales usan `.modal-body-glass`
- **Glass buttons**: definir `--c: var(--color-info)` local + `color-mix(in srgb, var(--c) 16%, transparent)` — nunca hex hardcodeado
- **Dark mode**: testear con `data-theme="dark"` en `<html>`. Nunca hardcodear `#000`/`#fff`
- **Fuente**: Inter (Google Fonts), pesos 300-700
- **Iconos**: SVG inline, sin libreria de iconos

### Servicios
- Todos `providedIn: 'root'`
- Estado reactivo con signals, expuestos como `.asReadonly()`
- Data fetching con `HttpClient` + RxJS, state update en `tap()` o `subscribe()`
- API base: `environment.apiUrl` (`/api/v1`) — nunca hardcodear URLs

### Pipes personalizados
- `dateAr`: formato dd/mm/yyyy (es-AR)
- `arsCurrency`: formato $ X.XX con locale es-AR
- `cuitFormat`: formato XX-XXXXXXXX-X

## Shared components

| Componente | Proposito |
|-----------|-----------|
| GlassCard | Card con backdrop-filter glassmorphism |
| GlassModal | Modal con fondo glass |
| GlassTable | Tabla estilizada glass |
| ConfirmDialog | Dialog de confirmacion reutilizable |
| FilterBar | Barra de filtros para listados |
| DateRangeSelector | Selector de rango de fechas |
| EmptyState | Placeholder cuando no hay datos |
| PageHeader | Titulo de pagina + area de acciones |
| Pagination | Navegacion paginada |
| SkeletonTable | Skeleton loading para tablas |
| StatusBadge | Badge coloreado por estado |
| ComentariosSection | Hilo de comentarios en entidades |
| GlobalSearch | Busqueda global debounced multi-entidad |
| Toast | Notificaciones auto-dismiss (4s, signal-based) |

## Rutas y roles

```
/login, /register                    → publicas
/ (MainLayout) [authGuard]
  /dashboard                         → todos
  /facturas, /ordenes-pago           → todos
  /convenios, /empresas-*            → admin, tesoreria, operador
  /pagos-programados                 → admin, tesoreria
  /aprobaciones                      → admin, operador
  /admin/usuarios, /admin/audit-logs → admin
```

## Proxy (desarrollo)

`/api` → `http://localhost:3100` (configurado en `proxy.conf.json` y `angular.json`)

## Docker (produccion)

Multi-stage: `node:20-alpine` build → `nginx:alpine` serve. SPA routing con `try_files`. API proxy via nginx `location /api/` → `http://api:3100/api/`.
