import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { Experience } from '../../models';

@Component({
  selector: 'app-experience',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class ExperienceComponent implements OnInit {
  experiences: Experience[] = [];
  currentExp: Experience = this.getEmptyExperience();
  showForm = false;
  isEditing = false;
  editIndex = -1;

  // Form related properties
  experienceForm!: FormGroup;

  // Inject services
  private resumeService = inject(ResumeService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.experiences = this.resumeService.getExperiences() || [];
    this.initForm();
  }

  // Initialize the form
  initForm(): void {
    this.experienceForm = this.fb.group({
      company: [''],
      position: [''],
      location: [''],
      startDate: [''],
      endDate: [''],
      currentlyWorking: [false],
      description: [''],
      achievements: this.fb.array([]),
    });
  }

  getEmptyExperience(): Experience {
    return {
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: '',
      achievements: [],
    };
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentExp = this.getEmptyExperience();
    this.resetForm();
    this.showForm = true;
  }

  editExperience(index: number): void {
    this.isEditing = true;
    this.editIndex = index;
    this.currentExp = { ...this.experiences[index] };
    if (!this.currentExp.achievements) {
      this.currentExp.achievements = [];
    }
    this.resetForm(this.currentExp);
    this.showForm = true;
  }

  deleteExperience(index: number): void {
    if (confirm('Are you sure you want to delete this experience?')) {
      this.resumeService.deleteExperience(index);
      this.experiences = this.resumeService.getExperiences();
    }
  }

  // Reset form with optional data
  resetForm(data?: Experience): void {
    // Clear the form
    this.experienceForm.reset({
      company: data?.company || '',
      position: data?.position || '',
      location: data?.location || '',
      startDate: data?.startDate || '',
      endDate: data?.endDate || '',
      currentlyWorking: data?.currentlyWorking || false,
      description: data?.description || '',
    });

    // Clear achievements FormArray
    this.achievementsArray.clear();

    // Add achievements if available
    if (data?.achievements && data.achievements.length > 0) {
      data.achievements.forEach(achievement => {
        this.addAchievement(achievement);
      });
    }
  }

  // FormArray getter
  get achievementsArray(): FormArray {
    return this.experienceForm.get('achievements') as FormArray;
  }

  // Add achievement to the FormArray
  addAchievement(value: string = ''): void {
    this.achievementsArray.push(this.fb.control(value));
  }

  // Remove achievement from FormArray
  removeAchievement(index: number): void {
    this.achievementsArray.removeAt(index);
  }

  // Handle the currently working checkbox
  onCurrentlyWorkingChange(): void {
    const currentlyWorking = this.experienceForm.get('currentlyWorking')?.value;

    if (currentlyWorking) {
      // Clear end date when currently working
      this.experienceForm.patchValue({ endDate: '' });

      // If we're adding a new experience or editing one that wasn't previously current
      if (!this.isEditing || !this.experiences[this.editIndex].currentlyWorking) {
        // Find any existing experience marked as "currently working"
        const currentJobIndex = this.experiences.findIndex(exp => exp.currentlyWorking);

        if (currentJobIndex !== -1 && currentJobIndex !== this.editIndex) {
          // Update the previously marked "current" job
          const updatedExp = {
            ...this.experiences[currentJobIndex],
            currentlyWorking: false,
            endDate: this.formatCurrentDate(),
          };

          this.resumeService.updateExperience(currentJobIndex, updatedExp);
          // Refresh experiences array
          this.experiences = this.resumeService.getExperiences();
        }
      }
    }
  }

  // Format current date as MM/YYYY
  formatCurrentDate(): string {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month.toString().padStart(2, '0')}/${year}`;
  }

  // Save the experience
  saveExperience(): void {
    if (this.experienceForm.invalid) {
      return;
    }

    // Get form values
    const formValues = this.experienceForm.value;

    // Create the experience object to save
    const experienceToSave: Experience = {
      company: formValues.company,
      position: formValues.position,
      location: formValues.location,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      currentlyWorking: formValues.currentlyWorking,
      description: formValues.description,
      achievements: formValues.achievements,
    };

    // Save to service
    if (this.isEditing) {
      this.resumeService.updateExperience(this.editIndex, experienceToSave);
    } else {
      this.resumeService.addExperience(experienceToSave);
    }

    // Update local array and reset form
    this.experiences = this.resumeService.getExperiences();
    this.cancelForm();
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editIndex = -1;
    this.resetForm();
  }
}
