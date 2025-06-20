import { Component, DestroyRef, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid';

import { ResumeService } from '../../services/resume';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-traits',
  templateUrl: './traits.html',
  styleUrls: ['./traits.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class TraitsComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  traitsForm: FormGroup;
  focusStates: { [key: string]: boolean } = {};

  private resumeService = inject(ResumeService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.traitsForm = this.fb.group({
      traits: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadSavedTraits();

    // If no traits exist, add an empty one to start
    if (this.traits.length === 0) {
      this.addTrait();
    }

    // Auto-save when form changes
    this.traitsForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(500), // Wait 500ms after last change before saving
      )
      .subscribe(() => {
        this.saveTraits();
      });
  }

  // Getter for easier access to the FormArray
  get traits(): FormArray {
    return this.traitsForm.get('traits') as FormArray;
  }

  // Create a new trait FormGroup
  createTrait(text: string = ''): FormGroup {
    return this.fb.group({
      id: [uuidv4()],
      text: [text, [Validators.required, Validators.minLength(2)]],
    });
  }

  // Add a new trait
  addTrait(): void {
    const newTraitIndex = this.traits.length;
    this.traits.push(this.createTrait());

    // Focus the new trait field after it's added
    setTimeout(() => {
      const inputElement = document.getElementById(`trait-${newTraitIndex}`);
      if (inputElement) {
        inputElement.focus();
      }
    });
  }

  // Remove a trait
  removeTrait(index: number): void {
    if (this.traits.length > 1) {
      this.traits.removeAt(index);
      this.saveTraits();
    } else {
      // If it's the last trait, just clear it
      const control = this.traits.at(0);
      control.get('text')?.setValue('');
    }
  }

  // Save traits to localStorage via service
  saveTraits(): void {
    if (this.traitsForm.valid) {
      const traitsData = this.traitsForm.value.traits;
      this.resumeService.saveTraits(traitsData);
    }
  }

  // Load traits from localStorage via service
  loadSavedTraits(): void {
    try {
      const traitsData = this.resumeService.getTraits();

      // Clear existing traits
      while (this.traits.length) {
        this.traits.removeAt(0);
      }

      // Add saved traits
      if (traitsData && traitsData.length > 0) {
        traitsData.forEach(trait => {
          this.traits.push(this.createTrait(trait.text));
        });
      }
    } catch (error) {
      console.error('Error loading traits:', error);
    }
  }

  // Track focus state for styling
  setFocus(index: number, isFocused: boolean): void {
    this.focusStates[`trait-${index}`] = isFocused;
  }

  // Check if control is valid
  isValid(index: number): boolean {
    const control = this.traits.at(index).get('text');
    return !!control?.valid && !!control?.touched;
  }

  // Check if control is invalid
  isInvalid(index: number): boolean {
    const control = this.traits.at(index).get('text');
    return !!control?.invalid && !!control?.touched;
  }

  // Get trait error message
  getErrorMessage(index: number): string {
    const control = this.traits.at(index).get('text');
    if (control?.hasError('required')) {
      return 'Trait cannot be empty';
    }
    if (control?.hasError('minlength')) {
      return 'Trait must be at least 2 characters';
    }
    return '';
  }

  // Check if we have traits to preview
  hasTraitsToPreview(): boolean {
    return this.traits.controls.some(control => {
      const value = control.get('text')?.value;
      return value && value.trim().length > 0;
    });
  }

  // Confirm deletion of all traits
  confirmDeleteAll(): void {
    if (confirm('Are you sure you want to delete all traits? This action cannot be undone.')) {
      this.deleteAllTraits();
    }
  }

  // Delete all traits
  deleteAllTraits(): void {
    // Clear the form array
    while (this.traits.length) {
      this.traits.removeAt(0);
    }

    // Add a single empty trait
    this.addTrait();

    // Delete from localStorage via service
    this.resumeService.deleteTraits();
  }

  goToPreviousSection(): void {
    this.saveTraits();
    this.navigate.emit('generalSections');
  }

  goToNextSection(): void {
    this.saveTraits();
    this.navigate.emit('personalDetails');
  }
}
