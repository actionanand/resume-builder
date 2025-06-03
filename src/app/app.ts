import { Component, OnInit, inject } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Profile } from './components/profile/profile';
import { Education } from './components/education/education';
import { Skills } from './components/skills/skills';
import { ExperienceComponent } from './components/experience/experience';
import { ProjectsComponent } from './components/projects/projects';
import { About } from './components/about/about';
import { QrCode } from './components/qr-code/qr-code';
import { Export } from './components/export/export';
import { Breadcrumb } from './components/breadcrumb/breadcrumb';
import { ResumeService } from './services/resume';
import { BreadcrumbItem } from './models';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    Profile,
    Education,
    ExperienceComponent,
    Skills,
    ProjectsComponent,
    About,
    QrCode,
    Export,
  ],
  providers: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  title = 'Resume Builder';
  currentSection = 'profile'; // Default section

  // Define breadcrumb sections
  breadcrumbSections: BreadcrumbItem[] = [
    { id: 'profile', label: 'Profile', icon: 'person', complete: false },
    { id: 'about', label: 'About', icon: 'info', complete: false },
    { id: 'skills', label: 'Skills', icon: 'star', complete: false },
    { id: 'experience', label: 'Experience', icon: 'work', complete: false },
    { id: 'projects', label: 'Projects', icon: 'assignment', complete: false },
    { id: 'education', label: 'Education', icon: 'school', complete: false },
    { id: 'qr-code', label: 'QR Code', icon: 'qr_code', complete: false },
  ];

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.updateCompletionStatus();
  }

  onSectionChange(sectionId: string): void {
    this.currentSection = sectionId;
  }

  // Method to update completion status of sections
  updateCompletionStatus(): void {
    const profile = this.resumeService.getProfile();
    this.breadcrumbSections[0].complete = !!(profile && profile.fullName && profile.email);

    const about = this.resumeService.getAbout();
    this.breadcrumbSections[1].complete = !!about;

    const skills = this.resumeService.getSkills();
    this.breadcrumbSections[2].complete = !!(skills && skills.length > 0);

    const experiences = this.resumeService.getExperiences();
    this.breadcrumbSections[3].complete = !!(experiences && experiences.length > 0);

    const projects = this.resumeService.getProjects();
    this.breadcrumbSections[4].complete = !!(projects && projects.length > 0);

    const education = this.resumeService.getEducation();
    this.breadcrumbSections[5].complete = !!(education && education.length > 0);

    // QR code is considered complete if any section is complete
    this.breadcrumbSections[6].complete = this.breadcrumbSections.some(
      (section, index) => index < 6 && section.complete,
    );
  }
}
