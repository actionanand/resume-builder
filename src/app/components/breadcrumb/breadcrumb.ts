import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreadcrumbItem } from '../../models';

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule],
  templateUrl: './breadcrumb.html',
  styleUrls: ['./breadcrumb.scss'],
})
export class Breadcrumb {
  @Input() sections: BreadcrumbItem[] = [];
  @Input() activeSection = '';
  @Output() sectionChange = new EventEmitter<string>();

  onSectionClick(sectionId: string): void {
    this.sectionChange.emit(sectionId);
  }
}
