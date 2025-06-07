import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-about',
  imports: [CommonModule, FormsModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  aboutText = '';
  editableText = '';
  isEditing = false;
  contentChanged = false;

  @Output() navigate = new EventEmitter<string>();

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.aboutText = this.resumeService.getAbout() || '';
    this.editableText = this.aboutText;
  }

  startEditing(): void {
    this.editableText = this.aboutText;
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.editableText = this.aboutText; // Reset to original value
    this.isEditing = false;
    this.contentChanged = false;
  }

  onTextChange(): void {
    this.contentChanged = true;
  }

  saveAbout(): void {
    if (this.isEditing || this.contentChanged) {
      this.aboutText = this.editableText;
      this.resumeService.saveAbout(this.aboutText);
      this.isEditing = false;
      this.contentChanged = false;
    }
  }

  saveAndNavigate(): void {
    // Save any pending changes
    this.saveAbout();
  }

  goToPreviousSection(): void {
    this.saveAndNavigate();
    this.navigate.emit('profile');
  }

  goToNextSection(): void {
    this.saveAndNavigate();
    this.navigate.emit('skills');
  }
}
