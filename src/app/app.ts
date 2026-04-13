import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="background-orb-container">
      <div class="background-orb orb-1"></div>
      <div class="background-orb orb-2"></div>
      <div class="background-orb orb-3"></div>
    </div>
    <router-outlet />
  `,
  styles: [`:host { display: block; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  constructor(private theme: ThemeService) {}
  ngOnInit() { this.theme.init(); }
}
