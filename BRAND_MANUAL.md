# Perc - Manual de Marca Tecnico

> Guia tecnica del sistema de diseno actual de Perc Platform.
> Este documento describe **lo que existe hoy** en el codebase para que cualquier desarrollador pueda codear consistentemente con nuestro framework.

---

## 1. Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Framework | Angular (standalone components, signals) |
| Estilos | SCSS con CSS Custom Properties |
| Tipografia | Google Fonts - Inter (300-700) |
| Iconos | SVG sprites via `<app-icon>` + SVGs inline |
| Temas | `data-theme="dark"` en `<html>` + `prefers-color-scheme` fallback |

---

## 2. Paleta de Colores

### 2.1 Colores Primarios

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--color-primary` | `#6366f1` | `#818cf8` | Acciones principales, links, acentos |
| `--color-primary-dark` | `#4f46e5` | `#6366f1` | Hover de primarios |
| `--color-primary-light` | `#818cf8` | `#a5b4fc` | Fondos suaves primarios |

### 2.2 Colores de Estado

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-success` | `#22c55e` | Ingresos, pagos exitosos, balances positivos |
| `--color-warning` | `#f59e0b` | Alertas, pendientes |
| `--color-error` | `#ef4444` | Errores, egresos, balances negativos |
| `--color-info` | `#3b82f6` | Informacion, tips |

### 2.3 Colores de Moneda

| Token | Valor | Moneda |
|-------|-------|--------|
| `--color-ars` | `#22c55e` | Peso Argentino |
| `--color-usd` | `#3b82f6` | Dolar |
| `--color-eur` | `#14b8a6` | Euro |
| `--color-btc` | `#f7931a` | Bitcoin |
| `--color-eth` | `#627eea` | Ethereum |

### 2.4 Escala de Grises

La escala de grises se **invierte automaticamente** en dark mode via CSS variables:

| Token | Light | Dark |
|-------|-------|------|
| `--color-white` | `#ffffff` | `#0f172a` |
| `--color-gray-50` | `#f9fafb` | `#1e293b` |
| `--color-gray-100` | `#f3f4f6` | `#334155` |
| `--color-gray-200` | `#e5e7eb` | `#475569` |
| `--color-gray-300` | `#d1d5db` | `#64748b` |
| `--color-gray-400` | `#9ca3af` | `#94a3b8` |
| `--color-gray-500` | `#6b7280` | `#cbd5e1` |
| `--color-gray-600` | `#4b5563` | `#e2e8f0` |
| `--color-gray-700` | `#374151` | `#f1f5f9` |
| `--color-gray-800` | `#1f2937` | `#f8fafc` |
| `--color-gray-900` | `#111827` | `#ffffff` |

**Regla fundamental:** Siempre usar los tokens `--color-gray-*`. Nunca hardcodear colores de texto o fondo. Al invertirse automaticamente, el dark mode funciona sin esfuerzo extra.

---

## 3. Tipografia

**Fuente:** Inter (Google Fonts)
**Fallback:** -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif

### Escala Tipografica

| Token | Tamano | Uso tipico |
|-------|--------|-----------|
| `--font-size-xs` | 0.75rem (12px) | Badges, hints, metadata |
| `--font-size-sm` | 0.875rem (14px) | Labels, descripciones, texto secundario |
| `--font-size-base` | 1rem (16px) | Texto base, inputs, botones |
| `--font-size-lg` | 1.125rem (18px) | Subtitulos, nombres de empresa |
| `--font-size-xl` | 1.25rem (20px) | Titulos de modal/seccion |
| `--font-size-2xl` | 1.5rem (24px) | Montos en inputs |
| `--font-size-3xl` | 1.875rem (30px) | Montos grandes en confirmacion |
| `--font-size-4xl` | 2.25rem (36px) | Balance principal |

### Pesos Usados

| Peso | Uso |
|------|-----|
| 300 | No se usa frecuentemente |
| 400 | Texto normal |
| 500 | Labels, texto medio, botones secundarios |
| 600 | Botones primarios, subtitulos, nombres |
| 700 | Montos, balances, titulos principales |

### Convencion de Texto

```scss
// Titulos de seccion
font-size: var(--font-size-xl);
font-weight: 600;
color: var(--color-gray-900);

// Subtitulo / descripcion
font-size: var(--font-size-sm);
color: var(--color-gray-500);

// Montos de dinero
font-size: var(--font-size-3xl);
font-weight: 700;
color: var(--color-gray-900);
letter-spacing: -0.02em;

// Labels de formulario
font-size: var(--font-size-sm);
font-weight: 500;
color: var(--color-gray-700);

// Texto muted / hint
font-size: var(--font-size-xs);
color: var(--color-gray-400);
```

---

## 4. Espaciado

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-2xs` | 0.125rem (2px) | Micro-gaps entre lineas de texto compactas |
| `--spacing-xs` | 0.25rem (4px) | Gaps minimos, padding de badges |
| `--spacing-sm` | 0.5rem (8px) | Gap entre label e input, padding small |
| `--spacing-md` | 1rem (16px) | Padding estandar, gap entre elementos |
| `--spacing-lg` | 1.5rem (24px) | Padding de cards, gap entre secciones |
| `--spacing-xl` | 2rem (32px) | Padding de modals, separacion mayor |
| `--spacing-2xl` | 3rem (48px) | Padding de secciones grandes, empty states |

**Regla:** Nunca usar `gap: 2px` ni `padding: 2px`. Siempre usar `var(--spacing-2xs)` o superior.

### Convencion de Padding

```scss
// Cards y contenedores
padding: var(--spacing-lg);               // 24px uniforme

// Modals
padding: var(--spacing-xl);               // 32px header/footer
padding: var(--spacing-md) var(--spacing-xl); // body (16px top/bottom, 32px sides)

// Inputs
padding: 0.875rem var(--spacing-md);      // 14px vertical, 16px horizontal

// Botones
padding: 0.875rem var(--spacing-xl);      // 14px vertical, 32px horizontal
```

---

## 5. Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 6px | Inputs, alerts, badges |
| `--radius-md` | 12px | Cards internas, tabs |
| `--radius-lg` | 16px | Cards principales, modals |
| `--radius-xl` | 24px | Contenedor balance+acciones |
| `--radius-full` | 9999px | Avatares, pills, iconos circulares, spinners |
| `--glass-radius` | 18px | Tarjetas glass, botones glass |

> **Regla:** Nunca usar `border-radius: 50%` ni `border-radius: 999px`. Siempre usar `var(--radius-full)` para elementos circulares o pill.

---

## 6. Sombras

| Token | Light | Uso |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Elementos sutiles |
| `--shadow-md` | `0 4px 6px + 0 2px 4px` | Cards, botones |
| `--shadow-lg` | `0 10px 15px + 0 4px 6px` | Dropdowns, popovers |
| `--shadow-xl` | `0 20px 25px + 0 10px 10px` | Modals |

En dark mode las sombras usan opacidades mas altas (`rgba(0,0,0,0.3-0.4)`) para generar contraste sobre fondos oscuros.

---

## 7. Transiciones

| Token | Valor | Uso |
|-------|-------|-----|
| `--transition-fast` | 150ms ease | Hover de iconos, color changes |
| `--transition-base` | 200ms ease | Focus de inputs, animaciones UI |
| `--transition-slow` | 300ms ease | Cambios de tema, backgrounds |
| `--glass-speed` | 260ms | Animaciones de tarjetas glass |
| `--glass-ease` | `cubic-bezier(.2,.8,.2,1)` | Easing premium para glass |

---

## 8. Sistema Glassmorphism

El corazon visual de Perc. Todas las tarjetas interactivas usan este sistema.

### 8.1 Clase `.card-glass`

Aplica el efecto completo de cristal esmerilado:

```html
<div class="card-glass">
  Contenido de la tarjeta
</div>
```

**Lo que incluye automaticamente:**
- Fondo semi-transparente con `backdrop-filter: blur(24px) saturate(150%)`
- Borde sutil (`1px solid` con opacidad)
- Sombra con profundidad
- `::before` — highlight interno superior (simula reflejo de luz)
- `::after` — overlay de tints de color (aparece en hover)
- Hover: `translateY(-2px)` + sombra mas profunda + tints visibles
- Transiciones suaves con easing premium

### 8.2 Tokens Glass

| Token | Light | Dark |
|-------|-------|------|
| `--glass-bg` | `rgba(255,255,255,0.45)` | `rgba(22,30,46,0.78)` |
| `--glass-border` | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.08)` |
| `--glass-blur` | `24px` | `24px` |
| `--glass-sat` | `150%` | `150%` |
| `--glass-inner-highlight` | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.06)` |

**Filosofia por tema:**
- **Light mode:** Cristal translucido, brillante, deja pasar colores del fondo
- **Dark mode:** Cristal denso, opaco, solido con bordes sutiles

### 8.3 Utilidades de Color Glass

Clases para iconos y badges con efecto glass coloreado:

```html
<div class="bg-glass-blue">Icono azul</div>
<div class="bg-glass-red">Icono rojo</div>
```

| Clase | Color base |
|-------|-----------|
| `.bg-glass-blue` | `#3b82f6` |
| `.bg-glass-red` | `#ef4444` |
| `.bg-glass-purple` | `#8b5cf6` |
| `.bg-glass-green` | `#22c55e` |
| `.bg-glass-orange` | `#f97316` |
| `.bg-glass-yellow` | `#f59e0b` |
| `.bg-glass-cyan` | `#06b6d4` |
| `.bg-glass-pink` | `#ec4899` |
| `.bg-glass-indigo` | `#6366f1` |

Estas clases usan `color-mix(in srgb, var(--c) 16%, transparent)` para generar fondos y bordes automaticamente. En dark mode suben a 22% de opacidad.

### 8.4 Clase `.modal-body-glass`

Background con gradientes ambient para modals. Se aplica al `.modal-container`:

```html
<div class="modal-container modal-body-glass">
  <!-- header, body, footer -->
</div>
```

Incluye 4 `radial-gradient` posicionados en esquinas diferentes (indigo, violeta, azul, rosa) que dan profundidad al fondo para que las tarjetas glass tengan algo que difuminar.

---

## 9. Componentes UI

### 9.1 Botones

#### Primario (`.btn-primary`)
```html
<button class="btn-primary" type="button">Confirmar</button>
```
- Color base: `--c: var(--color-info)` (resuelve a `#3b82f6`)
- Fondo: `color-mix(in srgb, var(--c) 16%, transparent)` sobre glass
- Hover: mas opaco + `translateY(-2px)` + sombra profunda
- Deshabilitado: `opacity: 0.6`

#### Secundario (`.btn-secondary`)
```html
<button class="btn-secondary" type="button">Cancelar</button>
```
- Fondo: `--color-gray-100` con backdrop blur
- Texto: `--color-gray-700`
- Hover: fondo `--color-gray-200` + `translateY(-1px)`

#### Con spinner de carga
```html
<button class="btn-primary" [disabled]="isLoading">
  @if (isLoading) {
    <span class="spinner"></span>
    Procesando...
  } @else {
    Confirmar
  }
</button>
```

### 9.2 Modals

Estructura estandar de todos los modals:

```html
@if (isOpen()) {
  <div class="modal-backdrop" (click)="onBackdropClick($event)">
    <div class="modal-container modal-body-glass">

      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2>Titulo</h2>
          <p>Descripcion</p>
        </div>
        <button class="close-btn" (click)="onClose()">
          <svg><!-- X icon --></svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <div class="step-content">
          <!-- Contenido del paso actual -->
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-secondary">Volver</button>
        <button class="btn-primary">Continuar</button>
      </div>

    </div>
  </div>
}
```

**Dimensiones estandar:**
- `max-width: 520px` (modals normales) o `900px` (operate-modal)
- `max-height: 90vh`
- `border-radius: var(--radius-lg)`

**Animaciones:**
- Backdrop: `fadeIn` (opacity 0 -> 1)
- Container: `slideUp` (translateY 20px -> 0 + opacity)
- Pasos: cada `step-content` tiene `fadeIn`

### 9.3 Tarjetas de Categoria / Empresa

```html
<button class="category-card card-glass" type="button">
  <div class="category-icon bg-glass-yellow">
    <svg><!-- Icono --></svg>
  </div>
  <span class="category-name">Electricidad</span>
</button>
```

Grid: `grid-template-columns: repeat(3, 1fr)` (2 en mobile)

### 9.4 Formularios

```html
<div class="form-group">
  <label for="field">Label del campo</label>
  <input type="text" id="field" placeholder="Placeholder..." />
  <span class="form-hint">Texto de ayuda</span>
</div>
```

**Input focus:**
```scss
border-color: var(--color-primary);
background: var(--color-white);
box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
```

### 9.5 Alertas

```html
<!-- Error -->
<div class="error-alert">
  <span class="error-icon">!</span>
  <span class="error-text">Mensaje de error</span>
</div>

<!-- Info -->
<div class="info-alert">
  <app-icon name="info" size="md"></app-icon>
  <span>Mensaje informativo</span>
</div>
```

### 9.6 Badges

```html
<span class="badge badge-success">Completado</span>
<span class="badge badge-info">Pendiente</span>
```

### 9.7 Skeleton Loading

```html
<!-- Tarjeta skeleton -->
<div class="category-card skeleton"></div>

<!-- Texto skeleton -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text-sm" style="width: 60%"></div>

<!-- Circulo skeleton -->
<div class="skeleton skeleton-circle" style="width: 40px; height: 40px"></div>
```

### 9.8 Iconos (`<app-icon>`)

```html
<app-icon name="btc" size="lg"></app-icon>
```

| Size | Pixeles |
|------|---------|
| `xs` | 16px |
| `sm` | 20px |
| `md` | 24px (default) |
| `lg` | 32px |
| `xl` | 48px |
| `2xl` | 64px |

Los iconos heredan `color` del padre via `fill: currentColor`.

### 9.9 Bubble Tabs

```html
<app-bubble-tabs [tabs]="tabs" (tabChange)="onTabChange($event)"></app-bubble-tabs>
```

Tabs con indicador animado que "flota" entre opciones con una animacion tipo burbuja (`bubble-lift`).

---

## 10. Layout

### 10.1 Dashboard Grid

```scss
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 380px;  // Contenido + sidebar
  gap: var(--spacing-xl);
}

// Tablet: columna unica
@media (max-width: 1200px) {
  grid-template-columns: 1fr;
}
```

### 10.2 Background Animado

El fondo global tiene:
1. **Gradiente animado** en `<html>` (blue-50 -> purple-50 -> pink-50) con `gradient-shift` a 20s
2. **3 orbs flotantes** con blur de 80px que rotan/pulsan lentamente
3. El `<body>` es transparente para que se vea todo

En dark mode los orbs cambian a rojo/azul y el gradiente base es navy profundo.

### 10.3 Breakpoints

| Nombre | Query | Cambios principales |
|--------|-------|-------------------|
| Desktop | > 1200px | Grid de 2 columnas |
| Tablet | 768px - 1200px | 1 columna, sidebar debajo |
| Mobile | 480px - 768px | Padding reducido, iconos mas chicos |
| Small | < 480px | Modal fullscreen, botones full-width |

---

## 11. Dark Mode

### Como funciona

1. El atributo `data-theme="dark"` en `<html>` activa dark mode
2. Fallback: `@media (prefers-color-scheme: dark)` si no hay atributo explicito
3. Las CSS variables se redefinen automaticamente
4. Los grises se **invierten** (gray-50 light = gray-50 dark distinto)

### Convencion para componentes nuevos

```scss
// BIEN - usa variables que se adaptan solas
color: var(--color-gray-900);
background: var(--color-gray-50);
border: 1px solid var(--color-gray-200);

// MAL - hardcodea colores
color: #111827;
background: #f9fafb;
border: 1px solid #e5e7eb;
```

Para overrides especificos de dark mode en componentes:
```scss
:host-context([data-theme="dark"]) .mi-elemento {
  // override especifico
}
```

---

## 12. Animaciones

### Catalogo de Keyframes Globales

| Nombre | Uso | Duracion tipica |
|--------|-----|----------------|
| `fadeIn` | Aparicion de pasos/contenido | `--transition-fast` (150ms) |
| `slideUp` | Entrada de modals | `--transition-base` (200ms) |
| `spin` | Spinners de carga | 0.8s linear infinite |
| `skeleton-shimmer` | Loading de skeletons | 1.5s ease-in-out infinite |
| `gradient-shift` | Fondo animado global | 20s ease infinite |
| `orb-pulse` | Orbs del background | 15-18s ease-in-out infinite |
| `orb-spin` | Rotacion de orbs | 20-25s linear infinite |
| `bubble-lift` | Animacion de tabs | 0.5s cubic-bezier |
| `dropdownFadeIn` | Apertura de dropdowns | 0.15s ease-out |

### Patrones de Hover

```scss
// Tarjetas glass
transform: translateY(-2px);

// Botones primarios
transform: translateY(-2px);

// Botones secundarios
transform: translateY(-1px);

// Iconos/avatares circulares
transform: scale(1.05);

// Quick actions
transform: translateY(-4px);  // mas dramatico
```

---

## 13. Gradientes

### Background Gradientes

| Token | Uso |
|-------|-----|
| `--gradient-bg-liquid-glass` | Fondo principal de la app |
| `--gradient-bg-alternate` | Fondo alternativo |
| `--gradient-bg-perc` | Fondo branding Perc |
| `--gradient-sidebar` | Sidebar (violeta -> indigo) |

### Card Gradientes

| Token | Color |
|-------|-------|
| `--gradient-card-orange` | Naranjas suaves |
| `--gradient-card-blue` | Azules suaves |
| `--gradient-card-purple` | Violetas suaves |
| `--gradient-card-pink` | Rosas suaves |
| `--gradient-card-green` | Verdes suaves |

### Button Gradientes

| Token | Color |
|-------|-------|
| `--gradient-btn-blue` | Azul vibrante |
| `--gradient-btn-blue-purple` | Azul a violeta |
| `--gradient-btn-orange-red` | Naranja a rojo |
| `--gradient-btn-green` | Verde vibrante |

---

## 14. Patron `--c` + `color-mix()` para Botones Glass

Todos los botones glass usan una variable CSS local `--c` que define su color. Esto permite generar fondo, borde y hover automaticamente:

```scss
.mi-boton {
  --c: var(--color-info);  // Siempre usar un token, nunca un hex directo
  color: var(--c);
  background: color-mix(in srgb, var(--c) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 20%, transparent);
  border-radius: var(--radius-full);  // o var(--glass-radius) para rectangulares
  backdrop-filter: blur(10px) saturate(140%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: all var(--glass-speed) var(--glass-ease);

  &:hover {
    background: color-mix(in srgb, var(--c) 24%, transparent);
    border-color: color-mix(in srgb, var(--c) 30%, transparent);
  }
}
```

**Tokens disponibles para `--c`:**
| Token | Resultado | Uso |
|-------|-----------|-----|
| `var(--color-info)` | Azul `#3b82f6` | Botones primarios, links de accion |
| `var(--color-primary)` | Indigo `#6366f1` / `#818cf8` dark | Botones login, spinners de proceso |
| `var(--color-success)` | Verde `#22c55e` | Botones de exito, confirmacion |
| `var(--color-warning)` | Amarillo `#f59e0b` | Avisos, disclaimers |
| `var(--color-error)` | Rojo `#ef4444` | Alertas, acciones destructivas |

**Spinners con el mismo patron:**
```scss
.mi-spinner {
  border: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}
```

---

## 15. Patrones de Codigo

### Estructura de un Componente Modal

```typescript
@Component({
  selector: 'app-mi-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-modal.component.html',
  styleUrl: './mi-modal.component.scss'
})
export class MiModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();

  protected readonly currentStep = signal<'step1' | 'step2' | 'success' | 'error'>('step1');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  onClose(): void {
    this.resetForm();
    this.closed.emit();
  }
}
```

### Flujo Multi-Step en Modals

1. `currentStep` signal controla que paso se muestra
2. Cada paso tiene su `@if (currentStep() === 'xxx')` en el template
3. El footer cambia botones segun el paso via `@switch`
4. `isLoading` signal para estados de carga
5. `errorMessage` signal para mostrar errores inline

### Patron de Loading en Botones

```html
<button class="btn-primary" [disabled]="isLoading()" (click)="onAction()">
  @if (isLoading()) {
    <span class="spinner"></span>
    Cargando...
  } @else {
    Accion
  }
</button>
```

---

## 16. Checklist para Componentes Nuevos

- [ ] Usar CSS variables para **todos** los colores, tamanos, espaciados
- [ ] **Nunca** hardcodear hex: usar `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`
- [ ] Para botones glass, usar el patron `--c: var(--color-info)` + `color-mix()`
- [ ] Para spinners, usar `color-mix(in srgb, var(--color-*) 30%, transparent)`
- [ ] Usar `var(--radius-full)` para circulos/pills (nunca `50%` ni `999px`)
- [ ] Usar `var(--spacing-2xs)` para micro-gaps (nunca `2px` directo)
- [ ] Aplicar `.card-glass` a tarjetas interactivas
- [ ] Aplicar `.modal-body-glass` al container de modals nuevos
- [ ] Usar `.btn-primary` y `.btn-secondary` para botones
- [ ] Agregar `animation: fadeIn var(--transition-fast)` a contenido que aparece
- [ ] Incluir skeleton loading para estados de carga
- [ ] Implementar estados hover con `translateY` y sombras
- [ ] Testear en light y dark mode
- [ ] Testear en mobile (< 480px)
- [ ] Usar `var(--color-gray-900)` para texto principal (nunca `#000` o `#fff`)
