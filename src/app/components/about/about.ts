import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-about',
  imports: [CommonModule, FormsModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About implements OnInit {
  aboutText = '';
  editableText = '';
  isEditing = false;

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.aboutText = this.resumeService.getAbout() || '';
  }

  startEditing(): void {
    this.editableText = this.aboutText;
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  saveAbout(): void {
    this.aboutText = this.editableText;
    this.resumeService.saveAbout(this.aboutText);
    this.isEditing = false;
  }
}
