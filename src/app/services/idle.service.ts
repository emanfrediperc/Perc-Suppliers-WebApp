import { Injectable, signal, computed, NgZone, DestroyRef, inject } from '@angular/core';
import { AuthService } from './auth.service';

const IDLE_TIMEOUT = 30 * 60;
const WARNING_THRESHOLD = 5 * 60;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

@Injectable({ providedIn: 'root' })
export class IdleService {
  private destroyRef = inject(DestroyRef);
  private remaining = signal(IDLE_TIMEOUT);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastActivity = Date.now();
  private throttleTimer = 0;
  private started = false;

  remainingSeconds = this.remaining.asReadonly();
  showWarning = computed(() => this.remaining() <= WARNING_THRESHOLD && this.remaining() > 0);
  displayTime = computed(() => {
    const s = this.remaining();
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  });

  constructor(private auth: AuthService, private zone: NgZone) {}

  start() {
    if (this.started) return;
    this.started = true;
    this.lastActivity = Date.now();
    this.remaining.set(IDLE_TIMEOUT);

    const onActivity = () => {
      const now = Date.now();
      if (now - this.throttleTimer < 1000) return;
      this.throttleTimer = now;
      this.lastActivity = now;
      if (this.remaining() > WARNING_THRESHOLD) return;
      this.remaining.set(IDLE_TIMEOUT);
    };

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, onActivity, { passive: true });
    }

    this.zone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.lastActivity) / 1000);
        const next = Math.max(IDLE_TIMEOUT - elapsed, 0);
        const prev = this.remaining();

        if (next !== prev) {
          if (next <= WARNING_THRESHOLD || prev <= WARNING_THRESHOLD) {
            this.zone.run(() => this.remaining.set(next));
          } else {
            this.remaining.set(next);
          }
        }

        if (next === 0) {
          this.stop();
          this.zone.run(() => this.auth.logout());
        }
      }, 1000);
    });

    this.destroyRef.onDestroy(() => this.stop());
  }

  renew() {
    this.lastActivity = Date.now();
    this.remaining.set(IDLE_TIMEOUT);
  }

  private stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.started = false;
  }
}
