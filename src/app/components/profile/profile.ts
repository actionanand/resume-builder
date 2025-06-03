import { CommonModule } from '@angular/common';
import { Component, inject, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  profile = {
    photoUrl: '',
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    stackoverflow: '',
    portfolio: '',
  };

  @Output() navigate = new EventEmitter<string>();

  private resumeService = inject(ResumeService);

  constructor() {
    const savedProfile = this.resumeService.getProfile();
    if (savedProfile) {
      this.profile = savedProfile;
    }
  }

  goToNextSection(): void {
    // Save profile data first
    this.saveProfile();
    // Then emit navigation event
    this.navigate.emit('about');
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        alert('Image size should be less than 1MB');
        return;
      }

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && e.target.result) {
          this.profile.photoUrl = e.target.result as string;
          this.saveProfile();
        }
      };

      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.profile.photoUrl = '';
    this.saveProfile();
  }

  saveProfile() {
    this.resumeService.saveProfile(this.profile);
  }
}
