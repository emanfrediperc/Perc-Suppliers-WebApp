import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { BarChartComponent, BarChartItem } from './bar-chart';
import { FormatNumberPipe } from './format-number.pipe';
import { FormatCurrencyPipe } from './format-currency.pipe';
import { NumberFormatDirective } from '../../../shared/number-format/number-format.directive';
import { InstrumentResult, INSTRUMENT_COLORS, INSTRUMENT_NAMES } from './simulator.types';

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    GlassCardComponent,
    BarChartComponent,
    FormatNumberPipe,
    FormatCurrencyPipe,
    NumberFormatDirective,
  ],
  template: `
    <app-page-header
      title="Simulador de Costos"
      subtitle="Comparación de instrumentos financieros para pase de cuenta"
    />

    <!-- Inputs -->
    <div class="param-grid">
      <app-glass-card title="Parámetros">
        <div class="input-stack">
          <div class="input-group">
            <label>Moneda</label>
            <select [ngModel]="currency()" (ngModelChange)="currency.set($event)">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div class="input-group">
            <label>Monto por operación</label>
            <input appNumberFormat [ngModel]="amount()" (ngModelChange)="amount.set($event)" />
          </div>
          <div class="input-group">
            <label>Frecuencia (ops/mes)</label>
            <input appNumberFormat [ngModel]="frequency()" (ngModelChange)="frequency.set($event)" />
          </div>
        </div>
      </app-glass-card>

      <app-glass-card title="Tasas y Honorarios">
        <div class="input-stack">
          <div class="input-group">
            <label>Tasa Descubierto (%/mes)</label>
            <input
              appNumberFormat [decimals]="2"
              [ngModel]="overdraftRate()"
              (ngModelChange)="overdraftRate.set($event)"
            />
          </div>
          <div class="input-group">
            <label>Honorarios Momentum (%)</label>
            <input
              appNumberFormat [decimals]="2"
              [ngModel]="momentumCommission()"
              (ngModelChange)="momentumCommission.set($event)"
            />
            <span class="hint">Por punta</span>
          </div>
          <div class="input-group">
            <label>Fee PERC (%)</label>
            <input
              appNumberFormat [decimals]="2"
              [ngModel]="percFee()"
              (ngModelChange)="percFee.set($event)"
            />
          </div>
        </div>
      </app-glass-card>

      <app-glass-card title="Crypto / TC">
        <div class="input-stack">
          <div class="input-group">
            <label>Setup Crypto (USD)</label>
            <input
              appNumberFormat
              [ngModel]="cryptoSetup()"
              (ngModelChange)="cryptoSetup.set($event)"
            />
            <span class="hint">0 = ya pagado</span>
          </div>
          @if (currency() === 'ARS') {
            <div class="input-group">
              <label>TC Referencial (USD/ARS)</label>
              <input
                appNumberFormat
                [ngModel]="exchangeRate()"
                (ngModelChange)="exchangeRate.set($event)"
              />
            </div>
          }
        </div>
      </app-glass-card>
    </div>

    <!-- Instrument Results -->
    <div class="results-grid">
      @for (v of instruments(); track v.name) {
        <div class="instrument-card" [style.--accent-color]="v.color">
          <div class="instrument-header">{{ v.name }}</div>
          <div class="instrument-rows">
            <div class="row">
              <span class="k">Por op</span>
              <span class="v hl">{{ v.perOp | fmtC: currency() }}</span>
            </div>
            <div class="row">
              <span class="k">%</span>
              <span class="v">{{ v.pct | fmtN: 3 }}%</span>
            </div>
            <div class="row">
              <span class="k">Mensual</span>
              <span class="v">{{ v.monthly | fmtC: currency() }}</span>
            </div>
            <div class="row total-row">
              <span class="k">Anual</span>
              <span class="v">{{ v.annual | fmtC: currency() }}</span>
            </div>
          </div>
          <div class="instrument-footer">
            <span>&#9889; {{ v.speed }}</span>
            <span class="sep">|</span>
            <span>&#9888;&#65039; {{ v.risk }}</span>
          </div>
        </div>
      }
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <app-glass-card title="Costo Anual">
        <app-bar-chart [items]="annualBars()" />
      </app-glass-card>
      <app-glass-card title="% sobre Volumen">
        <app-bar-chart [items]="pctBars()" />
      </app-glass-card>
    </div>

    <!-- Savings -->
    <app-glass-card
      [title]="'Ahorro vs Descubierto (' + (overdraftRate() | fmtN: 1) + '%/mes) · ' + currency()"
    >
      <div class="savings-grid">
        <div class="savings-item">
          <div class="savings-label">
            Vol. anual
            @if (currency() === 'ARS') {
              <span class="sublabel"> (ref: USD {{ annualVolume() / exchangeRate() | fmtN }})</span>
            }
          </div>
          <div class="savings-value">{{ annualVolume() | fmtC: currency() }}</div>
        </div>
        <div class="savings-item">
          <div class="savings-label">Descubierto/año</div>
          <div class="savings-value negative">{{ overdraftAnnual() | fmtC: currency() }}</div>
        </div>
        <div class="savings-item">
          <div class="savings-label">Mejor: {{ bestInstrument()?.name }}</div>
          <div class="savings-value">{{ bestInstrument()?.annual | fmtC: currency() }}</div>
        </div>
        <div class="savings-item">
          <div class="savings-label">Ahorro</div>
          <div class="savings-value positive">{{ savings() | fmtC: currency() }}</div>
        </div>
      </div>
    </app-glass-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .param-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .input-stack {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
      }

      .input-group label {
        display: block;
        font-size: 0.75rem;
        color: var(--color-gray-600);
        margin-bottom: 0.375rem;
        font-weight: 500;
      }

      .input-group input,
      .input-group select {
        width: 100%;
        background: var(--color-gray-50);
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        padding: 0.625rem 0.875rem;
        color: var(--color-gray-900);
        font-size: 0.875rem;
        font-weight: 600;
        transition: border-color 0.2s;
      }

      .input-group input:focus,
      .input-group select:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }

      .input-group input:hover:not(:focus),
      .input-group select:hover:not(:focus) {
        border-color: var(--color-gray-400);
      }

      .input-group .hint {
        display: block;
        font-size: 0.6875rem;
        color: var(--color-gray-500);
        margin-top: 0.25rem;
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .instrument-card {
        background: var(--color-white);
        border: 1px solid var(--color-gray-200);
        border-top: 3px solid var(--accent-color);
        border-radius: var(--radius-md);
        padding: 1.25rem;
        box-shadow: var(--shadow-sm);
      }

      .instrument-header {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.125em;
        font-weight: 700;
        color: var(--accent-color);
        margin-bottom: 1rem;
        padding-bottom: 0.625rem;
        border-bottom: 1px solid var(--color-gray-200);
      }

      .instrument-rows .row {
        display: flex;
        justify-content: space-between;
        padding: 0.375rem 0;
        font-size: 0.75rem;
        border-bottom: 1px solid var(--color-gray-100);
      }

      .instrument-rows .row:last-child {
        border-bottom: none;
      }

      .instrument-rows .k {
        color: var(--color-gray-500);
      }

      .instrument-rows .v {
        color: var(--color-gray-900);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }

      .instrument-rows .v.hl {
        color: var(--accent-color);
      }

      .instrument-rows .total-row {
        border-top: 2px solid var(--accent-color);
        margin-top: 0.5rem;
        padding-top: 0.625rem;
        font-weight: 700;
      }

      .instrument-rows .total-row .v {
        color: var(--accent-color);
        font-size: 0.9375rem;
      }

      .instrument-footer {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--color-gray-100);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.6875rem;
        color: var(--color-gray-500);
      }

      .instrument-footer .sep {
        opacity: 0.4;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .savings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.5rem;
      }

      .savings-item {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .savings-label {
        font-size: 0.6875rem;
        color: var(--color-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .savings-label .sublabel {
        color: var(--color-gray-400);
        text-transform: none;
      }

      .savings-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-gray-900);
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
      }

      .savings-value.negative {
        color: var(--color-error);
      }

      .savings-value.positive {
        color: var(--color-success);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimuladorComponent {
  // Input signals
  currency = signal('USD');
  amount = signal(100000);
  frequency = signal(4);
  overdraftRate = signal(5);
  momentumCommission = signal(0.1);
  percFee = signal(0.2);
  cryptoSetup = signal(0);
  exchangeRate = signal(1400);

  // Derived: volume
  monthlyVolume = computed(() => this.amount() * this.frequency());
  annualVolume = computed(() => this.monthlyVolume() * 12);

  // Derived: instrument costs
  instruments = computed<InstrumentResult[]>(() => {
    const monto = this.amount();
    const freq = this.frequency();
    const comMom = this.momentumCommission() / 100;
    const feePERC = this.percFee() / 100;
    const tc = this.exchangeRate();
    const cur = this.currency();
    const volAnual = monto * freq * 12;

    // Cost rates per operation
    const v1p = feePERC + 0.035 * feePERC;
    const v2p = comMom * 2 + 0.0002;
    const v3p = comMom * 2 + 0.0002 + 0.001;

    // Crypto fixed costs
    const cryptoSetupVal = this.cryptoSetup();
    const fixUSD = (cryptoSetupVal ? 0 : 37500 / 12) + 20000 / 12;
    const fix = cur === 'ARS' ? fixUSD * tc : fixUSD;

    const V: InstrumentResult[] = [
      {
        name: INSTRUMENT_NAMES[0],
        color: INSTRUMENT_COLORS[0],
        pct: v1p * 100,
        perOp: monto * v1p,
        monthly: monto * v1p * freq,
        annual: monto * v1p * freq * 12,
        speed: '24hs',
        risk: 'Bajo',
      },
      {
        name: INSTRUMENT_NAMES[1],
        color: INSTRUMENT_COLORS[1],
        pct: v2p * 100,
        perOp: monto * v2p,
        monthly: monto * v2p * freq,
        annual: monto * v2p * freq * 12,
        speed: 'Same-day',
        risk: 'Medio',
      },
      {
        name: INSTRUMENT_NAMES[2],
        color: INSTRUMENT_COLORS[2],
        pct: v3p * 100,
        perOp: monto * v3p,
        monthly: monto * v3p * freq,
        annual: monto * v3p * freq * 12,
        speed: 'Same-day',
        risk: 'M-Alto',
      },
      {
        name: INSTRUMENT_NAMES[3],
        color: INSTRUMENT_COLORS[3],
        pct: 0,
        perOp: monto * 0.001,
        monthly: monto * 0.001 * freq + fix,
        annual: (monto * 0.001 * freq + fix) * 12,
        speed: '24/7',
        risk: 'Alto',
      },
    ];

    // Crypto % is derived from annual cost / annual volume
    if (volAnual > 0) {
      V[3].pct = (V[3].annual / volAnual) * 100;
    }

    return V;
  });

  // Bar chart data
  annualBars = computed<BarChartItem[]>(() => {
    const fmtC = new FormatCurrencyPipe();
    const cur = this.currency();
    return this.instruments().map((v) => ({
      label: v.name,
      value: v.annual,
      displayValue: fmtC.transform(v.annual, cur) ?? '',
      color: v.color,
    }));
  });

  pctBars = computed<BarChartItem[]>(() => {
    const fmtN = new FormatNumberPipe();
    return this.instruments().map((v) => ({
      label: v.name,
      value: v.pct,
      displayValue: `${fmtN.transform(v.pct, 3)}%`,
      color: v.color,
    }));
  });

  // Savings
  overdraftAnnual = computed(() => (this.annualVolume() * this.overdraftRate()) / 100);
  bestInstrument = computed(() =>
    this.instruments().reduce((a, b) => (a.annual < b.annual ? a : b)),
  );
  savings = computed(() => this.overdraftAnnual() - (this.bestInstrument()?.annual ?? 0));
}
