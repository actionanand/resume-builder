import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { SkillGroup } from '../../models';

@Component({
  selector: 'app-skills',
  imports: [CommonModule, FormsModule],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills implements OnInit {
  skillGroups: SkillGroup[] = [];
  currentGroup: SkillGroup = { category: '', skills: [] };
  skillsInput = '';
  showForm = false;
  isEditing = false;
  editIndex = -1;

  @Output() navigate = new EventEmitter<string>();

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.skillGroups = this.resumeService.getSkills() || [];
  }

  goToPreviousSection(): void {
    this.navigate.emit('about');
  }

  goToNextSection(): void {
    this.navigate.emit('experience');
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentGroup = { category: '', skills: [] };
    this.skillsInput = '';
    this.showForm = true;
  }

  editSkillGroup(index: number): void {
    this.isEditing = true;
    this.editIndex = index;
    this.currentGroup = { ...this.skillGroups[index] };
    this.skillsInput = this.currentGroup.skills.join(', ');
    this.showForm = true;
  }

  deleteSkillGroup(index: number): void {
    if (confirm('Are you sure you want to delete this skill group?')) {
      this.skillGroups.splice(index, 1);
      this.resumeService.saveSkills(this.skillGroups);
    }
  }

  saveSkillGroup(): void {
    // Parse comma-separated skills
    const skills = this.skillsInput
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill !== '');

    this.currentGroup.skills = skills;

    if (this.isEditing) {
      this.skillGroups[this.editIndex] = { ...this.currentGroup };
    } else {
      this.skillGroups.push({ ...this.currentGroup });
    }

    this.resumeService.saveSkills(this.skillGroups);
    this.cancelForm();
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editIndex = -1;
    this.currentGroup = { category: '', skills: [] };
    this.skillsInput = '';
  }
}
