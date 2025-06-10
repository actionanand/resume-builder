import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { EducationEntry } from '../../models';

@Component({
  selector: 'app-education',
  imports: [CommonModule, FormsModule],
  templateUrl: './education.html',
  styleUrl: './education.scss',
})
export class Education implements OnInit {
  educationEntries: EducationEntry[] = [];
  currentEducation: EducationEntry = {
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    cgpa: '',
  };

  @Output() navigate = new EventEmitter<string>();

  showEducationForm = false;
  isEditing = false;
  editingIndex = -1;

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.educationEntries = this.resumeService.getEducation() || [];
  }

  goToPreviousSection(): void {
    this.navigate.emit('projects');
  }

  goToNextSection(): void {
    this.navigate.emit('certificates');
  }

  openAddEducationForm(): void {
    this.isEditing = false;
    this.currentEducation = {
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      cgpa: '',
    };
    this.showEducationForm = true;
  }

  editEducationEntry(index: number): void {
    this.isEditing = true;
    this.editingIndex = index;
    this.currentEducation = { ...this.educationEntries[index] };
    this.showEducationForm = true;
  }

  deleteEducationEntry(index: number): void {
    if (confirm('Are you sure you want to delete this education entry?')) {
      this.resumeService.deleteEducation(index);
      this.educationEntries = this.resumeService.getEducation();
    }
  }

  saveEducationEntry(): void {
    if (this.isEditing) {
      this.resumeService.updateEducation(this.editingIndex, this.currentEducation);
    } else {
      this.resumeService.addEducation(this.currentEducation);
    }

    this.educationEntries = this.resumeService.getEducation();
    this.cancelForm();
  }

  cancelForm(): void {
    this.showEducationForm = false;
    this.currentEducation = {
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      cgpa: '',
    };
    this.isEditing = false;
    this.editingIndex = -1;
  }
}
