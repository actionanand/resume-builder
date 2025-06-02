import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { Experience } from '../../models/resume.model';

@Component({
  selector: 'app-experience',
  imports: [CommonModule, FormsModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss'
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
      achievements: []
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
    this.currentExp = JSON.parse(JSON.stringify(this.experiences[index]));
    this.showForm = true;
  }

  deleteExperience(index: number): void {
    if (confirm('Are you sure you want to delete this experience?')) {
      this.resumeService.deleteExperience(index);
      this.experiences = this.resumeService.getExperiences();
    }
  }

  addAchievement(): void {
    this.currentExp.achievements.push('');
  }

  removeAchievement(index: number): void {
    this.currentExp.achievements.splice(index, 1);
  }

  saveExperience(): void {
    // Filter out empty achievements
    this.currentExp.achievements = this.currentExp.achievements.filter(a => a.trim() !== '');
    
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
  }
}
