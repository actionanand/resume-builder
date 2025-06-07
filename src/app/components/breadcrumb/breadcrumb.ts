import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreadcrumbItem } from '../../models';
import { BreadcrumbService } from '../../services/breadcrumb';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule],
  templateUrl: './breadcrumb.html',
  styleUrls: ['./breadcrumb.scss'],
})
export class Breadcrumb implements OnInit {
  sections: BreadcrumbItem[] = [];
  activeSection: string = 'profile';

  private breadcrumbService = inject(BreadcrumbService);
  private destroyRef = inject(DestroyRef);

  breadcrumbSectionSub!: Subscription;

  ngOnInit(): void {
    // Subscribe to sections updates
    this.breadcrumbService.sections$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sections => {
      console.log('Breadcrumb received section update:', sections);
      this.sections = sections;
    });

    // Subscribe to active section updates
    this.breadcrumbService.currentSection$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sectionId => {
      this.activeSection = sectionId;
    });
  }

  onSectionClick(sectionId: string): void {
    this.breadcrumbService.setCurrentSection(sectionId);
  }
}
