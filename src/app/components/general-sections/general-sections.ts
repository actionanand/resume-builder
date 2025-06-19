import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

import { ResumeService } from '../../services/resume';
import { GeneralSection } from '../../models';

@Component({
  selector: 'app-general-sections',
  imports: [CommonModule, FormsModule],
  templateUrl: './general-sections.html',
  styleUrls: ['./general-sections.scss'],
})
export class GeneralSectionsComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  generalSections: GeneralSection[] = [];
  sectionCount: number = 0;

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    // Load existing sections if any
    this.loadSections();
  }

  loadSections(): void {
    const savedSections = this.resumeService.getGeneralSections();
    if (savedSections && savedSections.length) {
      this.generalSections = savedSections;
      this.sectionCount = savedSections.length;
    }
  }

  updateSectionCount(): void {
    const currentCount = this.generalSections.length;

    // If we need to add sections
    if (this.sectionCount > currentCount) {
      for (let i = 0; i < this.sectionCount - currentCount; i++) {
        this.generalSections.push(this.createEmptySection());
      }
    }
    // If we need to remove sections
    else if (this.sectionCount < currentCount) {
      this.generalSections = this.generalSections.slice(0, this.sectionCount);
    }

    this.saveSections();
  }

  createEmptySection(): GeneralSection {
    return {
      id: uuidv4(),
      sectionName: '',
      location: '',
      startDate: '',
      endDate: '',
      title: '',
      description: '',
      currentPosition: false,
    };
  }

  addSection(): void {
    this.generalSections.push(this.createEmptySection());
    this.sectionCount = this.generalSections.length;
    this.saveSections();
  }

  removeSection(index: number): void {
    this.generalSections.splice(index, 1);
    this.sectionCount = this.generalSections.length;
    this.saveSections();
  }

  saveSections(): void {
    this.resumeService.saveGeneralSections(this.generalSections);
  }

  // Format date for display in resume
  formatDate(section: GeneralSection): string {
    // If both dates exist
    if (section.startDate && section.endDate) {
      return `${this.formatSingleDate(section.startDate)} - ${this.formatSingleDate(section.endDate)}`;
    }
    // If only start date exists
    else if (section.startDate) {
      return this.formatSingleDate(section.startDate);
    }
    // If only end date exists
    else if (section.endDate) {
      return this.formatSingleDate(section.endDate);
    }
    // No dates
    return '';
  }

  private formatSingleDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return `${month} ${year}`;
  }

  goToPreviousSection(): void {
    // this.saveDetails();
    this.navigate.emit('personalDetails');
  }

  goToNextSection(): void {
    // this.saveDetails();
    this.navigate.emit('declaration');
  }
}
