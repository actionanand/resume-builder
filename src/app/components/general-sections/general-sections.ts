import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

import { ResumeService } from '../../services/resume';
import { GeneralSection, SectionEntry } from '../../models';

@Component({
  selector: 'app-general-sections',
  imports: [CommonModule, FormsModule],
  templateUrl: './general-sections.html',
  styleUrls: ['./general-sections.scss'],
})
export class GeneralSectionsComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  generalSections: GeneralSection[] = [];
  newSectionName: string = '';
  newSectionNameFocused: boolean = false;

  private resumeService = inject(ResumeService);

  // Manage focus state for all inputs
  focusState: { [key: string]: boolean } = {};

  ngOnInit(): void {
    this.loadSections();
  }

  loadSections(): void {
    const savedSections = this.resumeService.getGeneralSections();
    if (savedSections && savedSections.length) {
      this.generalSections = savedSections;
    }
  }

  addSection(): void {
    if (!this.newSectionName.trim()) return;

    this.generalSections.push({
      id: uuidv4(),
      sectionName: this.newSectionName,
      entries: [],
    });

    // Add an entry automatically for better UX
    this.addEntry(this.generalSections.length - 1);

    this.newSectionName = ''; // Reset input
    this.saveSections();
  }

  removeSection(sectionIndex: number): void {
    if (confirm('Are you sure you want to remove this section and all its entries?')) {
      this.generalSections.splice(sectionIndex, 1);
      this.saveSections();
    }
  }

  addEntry(sectionIndex: number): void {
    this.generalSections[sectionIndex].entries.push(this.createEmptyEntry());
    this.saveSections();
  }

  removeEntry(sectionIndex: number, entryIndex: number): void {
    this.generalSections[sectionIndex].entries.splice(entryIndex, 1);
    this.saveSections();
  }

  createEmptyEntry(): SectionEntry {
    return {
      id: uuidv4(),
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      currentPosition: false,
    };
  }

  saveSections(): void {
    this.resumeService.saveGeneralSections(this.generalSections);
  }

  // Focus management
  setFocus(fieldName: string, sectionIndex: number, entryIndex: number, isFocused: boolean): void {
    const key = `${fieldName}-${sectionIndex}-${entryIndex}`;
    this.focusState[key] = isFocused;
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
