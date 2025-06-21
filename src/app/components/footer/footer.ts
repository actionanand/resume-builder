import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  yearStarted: number = 2025;
  currentrightYear: number = new Date().getFullYear();
  companyName: string = 'AR Résumé Builder';

  get copyRightYear(): string {
    return this.yearStarted === this.currentrightYear
      ? `${this.yearStarted}`
      : `${this.yearStarted} - ${this.currentrightYear}`;
  }
}
