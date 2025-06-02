import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
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
    portfolio: ''
  };
  
  private resumeService = inject(ResumeService);

  constructor() {
    const savedProfile = this.resumeService.getProfile();
    if (savedProfile) {
      this.profile = savedProfile;
    }
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profile.photoUrl = reader.result as string;
        this.saveProfile();
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
