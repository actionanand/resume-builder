import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { Experience } from '../../models/resume.model';

@Component({
  selector: 'app-experience',
  imports: [CommonModule, FormsModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class ExperienceComponent implements OnInit {
  experiences: Experience[] = [];
  currentExp: Experience = this.getEmptyExperience();
  showForm = false;
  isEditing = false;
  editIndex = -1;

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.experiences = this.resumeService.getExperiences() || [];
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
    this.showForm = true;
  }

  editExperience(index: number): void {
    this.isEditing = true;
    this.editIndex = index;
    this.currentExp = { ...this.experiences[index] };
    if (!this.currentExp.achievements) {
      this.currentExp.achievements = [];
    }
    this.showForm = true;
  }

  deleteExperience(index: number): void {
    if (confirm('Are you sure you want to delete this experience?')) {
      this.resumeService.deleteExperience(index);
      this.experiences = this.resumeService.getExperiences();
    }
  }

  // logic to handle the "currently working" checkbox
  onCurrentlyWorkingChange(): void {
    if (this.currentExp.currentlyWorking) {
      // Set end date to empty when "currently working" is checked
      this.currentExp.endDate = '';

      // If we're adding a new experience or editing an existing one that wasn't previously marked as current
      if (!this.isEditing || !this.experiences[this.editIndex].currentlyWorking) {
        // Find any existing experience marked as "currently working" and update it
        const currentJobIndex = this.experiences.findIndex(exp => exp.currentlyWorking);

        if (currentJobIndex !== -1 && currentJobIndex !== this.editIndex) {
          // Update the previously marked "current" job
          const updatedExp = {
            ...this.experiences[currentJobIndex],
            currentlyWorking: false,
            endDate: this.formatCurrentDate(), // Set end date to current date
          };

          this.resumeService.updateExperience(currentJobIndex, updatedExp);
          // Refresh experiences array
          this.experiences = this.resumeService.getExperiences();
        }
      }
    }
  }

  private formatCurrentDate(): string {
    const date = new Date();
    const month = date.getMonth() + 1; // getMonth() is zero-based
    const year = date.getFullYear();
    return `${month.toString().padStart(2, '0')}/${year}`;
  }

  addAchievement(): void {
    if (!this.currentExp.achievements) {
      this.currentExp.achievements = [];
    }
    this.currentExp.achievements.push('');
  }

  removeAchievement(index: number): void {
    this.currentExp.achievements.splice(index, 1);
  }

  saveExperience(): void {
    // Before saving, check if "currently working" is selected
    if (this.currentExp.currentlyWorking) {
      this.onCurrentlyWorkingChange();
    }

    if (this.isEditing) {
      this.resumeService.updateExperience(this.editIndex, this.currentExp);
    } else {
      this.resumeService.addExperience(this.currentExp);
    }

    this.experiences = this.resumeService.getExperiences();
    this.cancelForm();
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editIndex = -1;
    this.currentExp = this.getEmptyExperience();
  }
}
