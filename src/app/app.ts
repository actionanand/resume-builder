import { Component, DestroyRef, OnInit, inject } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { BreadcrumbItem, GeneralSection } from './models';
import { BreadcrumbService } from './services/breadcrumb';
import { Certificates } from './components/certificates/certificates';
import { Languages } from './components/languages/languages';
import { PersonalDetailsComponent } from './components/personal-details/personal-details';
import { Declaration } from './components/declaration/declaration';
import { GeneralSectionsComponent } from './components/general-sections/general-sections';
import { TraitsComponent } from './components/traits/traits';

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
    Certificates,
    Languages,
    PersonalDetailsComponent,
    Declaration,
    GeneralSectionsComponent,
    TraitsComponent,
  ],
  providers: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  title = 'Résumé Builder';
  currentSection = 'profile'; // Default section

  private breadcrumbServ = inject(BreadcrumbService);
  private resumeService = inject(ResumeService);
  private destroyRef = inject(DestroyRef);

  // Define breadcrumb sections
  breadcrumbSections: BreadcrumbItem[] = [
    { id: 'profile', label: 'Profile', icon: 'person', complete: false },
    { id: 'about', label: 'About', icon: 'info', complete: false },
    { id: 'skills', label: 'Skills', icon: 'star', complete: false },
    { id: 'experience', label: 'Experience', icon: 'work', complete: false },
    { id: 'projects', label: 'Projects', icon: 'assignment', complete: false },
    { id: 'education', label: 'Education', icon: 'school', complete: false },
    { id: 'certificates', label: 'Certificates', icon: 'card_membership', complete: false },
    { id: 'languages', label: 'Languages', icon: 'translate', complete: false },
    { id: 'generalSections', label: 'General Sections', icon: 'list', complete: false },
    { id: 'traits', label: 'Personal Traits', icon: 'emoji_people', complete: false },
    { id: 'personalDetails', label: 'Personal Details', icon: 'person_outline', complete: false },
    { id: 'declaration', label: 'Declaration', icon: 'gavel', complete: false },
    { id: 'qr-code', label: 'QR Code', icon: 'qr_code', complete: false },
  ];

  ngOnInit(): void {
    // Initial update
    this.updateCompletionStatus();

    // Subscribe to data change events from ResumeService
    this.resumeService.dataChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      console.log('Data changed, updating breadcrumb status');
      this.updateCompletionStatus();
    });

    // Subscribe to breadcrumb section changes
    this.breadcrumbServ.currentSection$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((sectionId: string) => {
      if (sectionId) {
        this.currentSection = sectionId;
      }
    });

    // Initialize breadcrumb service with sections
    this.breadcrumbServ.setSections(this.breadcrumbSections);
  }

  onSectionChange(sectionId: string): void {
    this.currentSection = sectionId;
    this.breadcrumbServ.setCurrentSection(sectionId);
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

    // For certificates, check if there is at least one complete certificate
    const certificates = this.resumeService.getCertificates();
    this.breadcrumbSections[6].complete = !!(
      certificates &&
      certificates.length > 0 &&
      certificates.some(cert => cert.name && cert.issuer)
    );

    const languages = this.resumeService.getLanguages();
    this.breadcrumbSections[7].complete = !!(languages && languages.length > 0 && languages.some(lang => lang.name));

    // For general sections, check if there are any sections defined
    const generalSections = this.resumeService.getGeneralSections();
    // Check if we have any general sections
    const hasSections = generalSections.length > 0;
    // Check if at least one section has entries
    const hasSectionWithEntries =
      hasSections &&
      generalSections.some((section: GeneralSection) => Array.isArray(section.entries) && section.entries.length > 0);
    // Set breadcrumb status based on both conditions
    const isGeneralSectionComplete = hasSections && hasSectionWithEntries;
    this.breadcrumbSections[8].complete = isGeneralSectionComplete;

    // For personal traits, check if any meaningful trait has been filled
    const traits = this.resumeService.getTraits();
    this.breadcrumbSections[9].complete = !!(
      traits &&
      traits.length > 0 &&
      traits.some(trait => trait.text && trait.text.trim() !== '')
    );

    // For personal details, check if any MEANINGFUL field has been filled
    const personalDetails = this.resumeService.getPersonalDetails();
    const hasRealPersonalDetails =
      personalDetails &&
      Object.keys(personalDetails).length > 0 &&
      // Check that it's not just default values
      Object.keys(personalDetails).some(key => key !== 'hasSiblings' && key !== 'siblingCount');
    this.breadcrumbSections[10].complete = !!hasRealPersonalDetails;

    // For declaration, check if the text is not empty
    const declaration = this.resumeService.getDeclaration();
    this.breadcrumbSections[11].complete = !!(declaration && declaration.text && declaration.text.trim() !== '');

    // QR code is considered complete if any section is complete
    this.breadcrumbSections[12].complete = this.breadcrumbSections.some(
      (section, index) => index < 12 && section.complete,
    );

    // Update the breadcrumb service with the new status
    this.breadcrumbServ.setSections([...this.breadcrumbSections]);
  }
}
