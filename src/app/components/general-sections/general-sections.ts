/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, Output, EventEmitter, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

import { ResumeService } from '../../services/resume';
import { GeneralSection, SectionEntry } from '../../models';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  // Manage focus state for all inputs
  focusState: { [key: string]: boolean } = {};

  private resumeService = inject(ResumeService);
  private destroyRef = inject(DestroyRef);

  // Subject for debouncing saves
  private saveSubject = new Subject<void>();

  ngOnInit(): void {
    this.loadSavedSections();

    // Set up debounced save
    this.saveSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(500), // Wait 500ms after last change before saving
      )
      .subscribe(() => {
        this.persistToLocalStorage();
      });
  }

  loadSavedSections(): void {
    try {
      const savedSections = this.resumeService.getGeneralSections();
      if (savedSections && Array.isArray(savedSections) && savedSections.length > 0) {
        this.generalSections = savedSections;
        console.log('Loaded general sections:', this.generalSections);
      }
    } catch (error) {
      console.error('Error loading general sections:', error);
    }
  }

  // Call this whenever a change is made
  triggerSave(): void {
    this.saveSubject.next();
  }

  // Actual save method
  persistToLocalStorage(): void {
    console.log('Saving general sections to localStorage:', this.generalSections);
    this.resumeService.saveGeneralSections(this.generalSections);
  }

  addSection(): void {
    if (!this.newSectionName.trim()) return;

    this.generalSections.push({
      id: uuidv4(),
      sectionName: this.newSectionName,
      entries: [],
    });

    this.newSectionName = '';
    this.triggerSave(); // Save after adding section
  }

  removeSection(sectionIndex: number): void {
    if (confirm('Are you sure you want to remove this section and all its entries?')) {
      this.generalSections.splice(sectionIndex, 1);
      this.triggerSave(); // Save after removing section
    }
  }

  addEntry(sectionIndex: number): void {
    this.generalSections[sectionIndex].entries.push(this.createEmptyEntry());
    this.triggerSave(); // Save after adding entry
  }

  removeEntry(sectionIndex: number, entryIndex: number): void {
    this.generalSections[sectionIndex].entries.splice(entryIndex, 1);
    this.triggerSave(); // Save after removing entry
  }

  // Add this to update model when form inputs change
  onFieldChange(): void {
    this.triggerSave();
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

  // Focus management
  setFocus(fieldName: string, sectionIndex: number, entryIndex: number, isFocused: boolean): void {
    const key = `${fieldName}-${sectionIndex}-${entryIndex}`;
    this.focusState[key] = isFocused;
  }

  goToPreviousSection(): void {
    this.triggerSave();
    this.navigate.emit('languages');
  }

  goToNextSection(): void {
    this.triggerSave();
    this.navigate.emit('traits');
  }
}
