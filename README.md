# Perc Suppliers WebApp

Frontend del sistema de gestion de pagos a proveedores. Angular 21 con componentes standalone, signals, y design system glassmorphism custom.

## Stack

- **Angular 21.1** (standalone, sin NgModules)
- **TypeScript 5.9**
- **State**: Angular Signals (sin NgRx)
- **Styling**: SCSS custom con glassmorphism (sin frameworks CSS)
- **Builder**: Vite (`@angular/build:application`)
- **Testing**: Vitest
- **Locale**: es-AR

## Setup

```bash
# Requisitos: Node 20.19.0, API corriendo en puerto 3100

npm install
npm start              # http://localhost:4200
```

> El proxy de desarrollo redirige `/api` a `http://localhost:3100`.

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm start` | Dev server en puerto 4200 |
| `npm run build` | Build produccion → `dist/` |
| `npm run watch` | Build con watch (development) |
| `npm test` | Tests con Vitest |

## Estructura

```
src/app/
├── guards/                # authGuard, roleGuard
├── layout/                # MainLayout + Sidebar
├── models/                # Interfaces TypeScript
├── pages/
│   ├── login/ + register/
│   ├── dashboard/
│   ├── facturas/          # list + detail + upload + pago modal
│   ├── ordenes-pago/      # list + detail
│   ├── convenios/         # list + detail + form modal
│   ├── empresas-proveedoras/ + empresas-clientes/
│   ├── aprobaciones/
│   ├── pagos-programados/
│   ├── estado-cuenta/
│   ├── reportes/
│   └── admin/             # usuarios + audit-logs
├── services/              # 1 por dominio + auth/theme/export
├── shared/                # Componentes reutilizables (glass-*)
└── pipes/                 # cuitFormat, arsCurrency, dateAr
```

## Design System

UI basada en **glassmorphism** con tema claro/oscuro. Todo el sistema visual esta documentado en [`BRAND_MANUAL.md`](BRAND_MANUAL.md).

Reglas clave:
- Usar tokens CSS: `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`
- Cards: `.card-glass` | Modales: `.modal-body-glass`
- Botones glass: definir `--c` local + `color-mix()`
- Nunca hardcodear colores o valores de spacing
- Testear siempre en dark mode

## Componentes compartidos

| Componente | Uso |
|-----------|-----|
| GlassCard / GlassModal / GlassTable | Primitivos visuales glass |
| FilterBar | Filtros en listados |
| Pagination | Paginacion |
| StatusBadge | Badge por estado |
| Toast | Notificaciones auto-dismiss |
| ConfirmDialog | Confirmacion de acciones |
| EmptyState | Sin resultados |
| SkeletonTable | Loading state |
| ComentariosSection | Comentarios en entidades |
| GlobalSearch | Busqueda multi-entidad |

## Rutas

Todas las rutas son lazy-loaded con `loadComponent`.

| Ruta | Acceso |
|------|--------|
| `/login`, `/register` | Publica |
| `/dashboard` | Todos los roles |
| `/facturas`, `/ordenes-pago`, `/reportes`, `/estado-cuenta` | Todos |
| `/convenios`, `/empresas-*` | admin, tesoreria, contabilidad |
| `/aprobaciones`, `/pagos-programados` | admin, tesoreria |
| `/admin/*` | admin |

## Docker

```bash
docker build -t perc-suppliers-webapp .
docker run -p 80:80 perc-suppliers-webapp
```

Nginx sirve el SPA y proxea `/api/` al servicio `api:3100`.

O desde la raiz: `docker compose up webapp`
