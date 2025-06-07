import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { BreadcrumbItem } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private sectionsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public sections$ = this.sectionsSubject.asObservable();

  private currentSectionSubject = new BehaviorSubject<string>('profile');
  public currentSection$ = this.currentSectionSubject.asObservable();

  setCurrentSection(sectionId: string): void {
    this.currentSectionSubject.next(sectionId);
  }

  setSections(sections: BreadcrumbItem[]): void {
    this.sectionsSubject.next(sections);
  }
}
