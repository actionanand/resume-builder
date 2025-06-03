import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { Project } from '../../models';

@Component({
  selector: 'app-projects',
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  currentProject: Project = {
    name: '',
    description: '',
    technologies: '',
    link: '',
    image: '',
  };
  showForm = false;
  isEditing = false;
  editIndex = -1;

  resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.projects = this.resumeService.getProjects() || [];
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentProject = {
      name: '',
      description: '',
      technologies: '',
      link: '',
      image: '',
    };
    this.showForm = true;
  }

  editProject(index: number): void {
    this.isEditing = true;
    this.editIndex = index;
    this.currentProject = { ...this.projects[index] };
    this.showForm = true;
  }

  deleteProject(index: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.resumeService.deleteProject(index);
      this.projects = this.resumeService.getProjects();
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.currentProject.image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.currentProject.image = '';
  }

  saveProject(): void {
    if (this.isEditing) {
      this.resumeService.updateProject(this.editIndex, this.currentProject);
    } else {
      this.resumeService.addProject(this.currentProject);
    }

    this.projects = this.resumeService.getProjects();
    this.cancelForm();
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editIndex = -1;
  }
}
