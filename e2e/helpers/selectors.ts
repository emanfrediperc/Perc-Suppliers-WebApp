/**
 * Centralized selectors / locators for the Perc-Suppliers E2E test suite.
 * Kept in one place so that CSS/label changes only touch this file.
 */

export const Routes = {
  LOGIN: '/login',
  CHANGE_PASSWORD: '/change-password',
  DASHBOARD: '/dashboard',
  FACTURAS: '/facturas',
  PRESTAMOS: '/prestamos',
  SIMULADOR: '/prestamos/simulador',
} as const;

export const ChangePasswordForm = {
  OLD_PASSWORD_INPUT: 'input[name="oldPassword"]',
  NEW_PASSWORD_INPUT: 'input[name="newPassword"]',
  CONFIRM_PASSWORD_INPUT: 'input[name="confirmPassword"]',
  SUBMIT_BUTTON_NAME: /cambiar contraseña/i,
  ERROR_MSG: '.error-msg',
} as const;

export const AuthForm = {
  EMAIL_INPUT: 'input[name="email"]',
  PASSWORD_INPUT: 'input[name="password"]',
  SUBMIT_BUTTON_NAME: /iniciar sesion/i,
} as const;

export const Listado = {
  PAGE_HEADING: /^Préstamos$/,
  // Use a text selector scoped to an h1 to avoid matching modal titles that
  // Angular projects to host attributes.
  REGISTER_BUTTON: 'button:has-text("Registrar Préstamo")',
  FILTERS_CARD: '.filters-card',
  // Each select lives in its own .filter-item — use the filter-item's position
  // to reach the select. The label order is: Estado / Moneda / Vehículo / Corte.
  STATUS_FILTER: '.filter-item:nth-of-type(1) select',
  CURRENCY_FILTER: '.filter-item:nth-of-type(2) select',
  VEHICLE_FILTER: '.filter-item:nth-of-type(3) select',
  BALANCE_CUT_FILTER: '.filter-item:nth-of-type(4) select',
  BUSCAR_BUTTON: 'button:has-text("Buscar")',
  LIMPIAR_BUTTON: 'button:has-text("Limpiar")',
  SUMMARY_GRID: '.summary-grid',
  SUMMARY_CARD: '.summary-grid app-glass-card',
  TABLE: 'app-glass-table table',
  TABLE_ROW: 'app-glass-table tbody tr',
  STATUS_BADGE: '.badge',
  NET_POSITION_SECTION: '.netpos-grid',
  NET_POSITION_BLOCK: '.netpos-grid app-glass-card',

  // Row action buttons — scope to actual <button> with title to avoid matching
  // the modal host elements which also get title projected as an HTML attribute.
  ACTION_EDIT_BUTTON: 'button[title="Editar"]',
  ACTION_RENEW_BUTTON: 'button[title="Renovar"]',
  ACTION_CLEAR_BUTTON: 'button[title="Cancelar"]',
  ACTION_HISTORY_BUTTON: 'button[title="Historial"]',
  ACTION_DELETE_BUTTON: 'button[title="Eliminar"]',
} as const;

export const FormModal = {
  // Match the actual modal overlay div (gated by @if(open())) rather than the
  // component host element (which is always in DOM but hidden).
  HOST: 'app-prestamo-form-modal .modal-overlay',
  CURRENCY_SELECT: 'select[name="currency"]',
  CAPITAL_INPUT: 'input[name="capital"]',
  RATE_INPUT: 'input[name="rate"]',
  START_DATE_INPUT: 'input[name="startDate"]',
  DUE_DATE_INPUT: 'input[name="dueDate"]',
  VEHICLE_SELECT: 'select[name="vehicle"]',
  BALANCE_CUT_SELECT: 'select[name="balanceCut"]',
  SUBMIT_BUTTON_NAME: /registrar préstamo/i,
  CANCEL_BUTTON_NAME: /^cancelar$/i,
} as const;

export const EditModal = {
  HOST: 'app-prestamo-edit-modal .modal-overlay',
  CAPITAL_INPUT: 'input[name="capital"]',
  RATE_INPUT: 'input[name="rate"]',
  DUE_DATE_INPUT: 'input[name="dueDate"]',
  VEHICLE_SELECT: 'select[name="vehicle"]',
  REASON_TEXTAREA: 'textarea[name="reason"]',
  SUBMIT_BUTTON_NAME: /guardar cambios/i,
} as const;

export const RenewModal = {
  HOST: 'app-prestamo-renew-modal .modal-overlay',
  CAPITAL_INPUT: 'input[name="capital"]',
  RATE_INPUT: 'input[name="rate"]',
  START_DATE_INPUT: 'input[name="startDate"]',
  DUE_DATE_INPUT: 'input[name="dueDate"]',
  VEHICLE_SELECT: 'select[name="vehicle"]',
  SUBMIT_BUTTON_NAME: /renovar préstamo/i,
} as const;

export const HistoryModal = {
  HOST: 'app-prestamo-history-modal .modal-overlay',
  ENTRY: '.timeline .entry',
} as const;

export const EmpresaPicker = {
  HOST: 'app-empresa-picker',
  INPUT: 'input[placeholder*="Buscar empresa"]',
  DROPDOWN: '.dropdown',
  DROPDOWN_ITEM: '.dropdown-item',
  SELECTED_CHIP: '.selected-chip',
  CLEAR_BUTTON: '.clear-btn',
} as const;

export const ConfirmDialog = {
  HOST: 'app-confirm-dialog',
  CONFIRM_BUTTON_NAME: /^(confirmar|cancelar préstamo|eliminar)$/i,
} as const;

export const Simulador = {
  PAGE_HEADING: /simulador de costos/i,
  INSTRUMENT_CARD: '.instrument-card',
  INSTRUMENT_HEADER: '.instrument-header',
  // Inputs are not associated to their labels via for/id, so use the
  // .input-group container text to scope to the right input.
  AMOUNT_INPUT: '.input-group:has(label:has-text("Monto por operación")) input',
  CURRENCY_SELECT: '.input-group:has(label:has-text("Moneda")) select',
  TC_INPUT: '.input-group:has(label:has-text("TC Referencial")) input',
} as const;
