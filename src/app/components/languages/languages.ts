import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { Language } from '../../models';

@Component({
  selector: 'app-languages',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './languages.html',
  styleUrls: ['./languages.scss'],
})
export class Languages implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  languageForm!: FormGroup;
  formSubmitted = false;

  proficiencyLevels = ['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'];

  private resumeService = inject(ResumeService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initForm();
    this.loadLanguages();
  }

  private initForm(): void {
    this.languageForm = this.fb.group({
      languages: this.fb.array([]),
    });
  }

  private loadLanguages(): void {
    const savedLanguages = this.resumeService.getLanguages();

    if (savedLanguages && savedLanguages.length > 0) {
      savedLanguages.forEach(lang => {
        this.addLanguage(lang);
      });
    } else {
      // Add one empty language by default
      this.addLanguage();
    }
  }

  get languagesArray(): FormArray {
    return this.languageForm.get('languages') as FormArray;
  }

  addLanguage(language?: Language): void {
    this.languagesArray.push(
      this.fb.group({
        name: [language?.name || '', Validators.required],
        proficiency: [language?.proficiency || 'Professional', Validators.required],
      }),
    );
  }

  removeLanguage(index: number): void {
    this.languagesArray.removeAt(index);
  }

  // Only save if there's valid data
  saveLanguages(): void {
    this.formSubmitted = true;

    // Filter out empty languages before saving
    if (this.languageForm.valid) {
      const languages = this.languageForm.value.languages.filter((lang: Language) => lang.name);

      if (languages.length > 0) {
        this.resumeService.saveLanguages(languages);
      }
    }
  }

  goToPreviousSection(): void {
    this.saveLanguages();
    this.navigate.emit('certificates');
  }

  goToNextSection(): void {
    this.saveLanguages();
    this.navigate.emit('personalDetails');
  }
}
