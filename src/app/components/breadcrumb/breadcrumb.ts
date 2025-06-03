import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Section } from '../../models';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  @Input() sections: Section[] = [];
  @Input() currentSection: string = '';
  @Output() sectionChange = new EventEmitter<string>();

  changeSection(sectionId: string): void {
    this.sectionChange.emit(sectionId);
  }
}
