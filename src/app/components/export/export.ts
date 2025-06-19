/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, ElementRef, ViewChild, inject, Input, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { QRCodeComponent } from 'angularx-qrcode';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
// import pdfMake from 'pdfmake/build/pdfmake';
// import pdfFonts from 'pdfmake/build/vfs_fonts';

import { ResumeService } from '../../services/resume';
import {
  DeclarationDef,
  PdfDocDefinition,
  SkillCategory,
  SkillColumn,
  SkillComma,
  SkillGroup,
  SkillPill,
  ThemeColors,
  GeneralSection,
  SectionEntry,
  PersonalDetails,
} from '../../models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-export',
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './export.html',
  styleUrls: ['./export.scss', './export.general-section.scss'],
})
export class Export implements OnInit {
  @ViewChild('resumePreview') resumePreview!: ElementRef;
  @Input() previewOnly = false;

  markdownContent = '';
  selectedTheme = 'modern';
  selectedFontSize = 'medium';
  isGeneratingPDF = false;
  exportMessage = '';
  showPreview = true;
  showContactIcons = true;
  showHyperlinkUrls = false;
  useDefaultPillColors = true;

  exportFilename: string = '';

  includeSignatureLine = true;
  useDigitalSignature = false;
  signatureImageUrl: string | null = null;

  includeQrCode = false;
  qrCodeSize = 'medium';
  qrData: { qrDataString: string; darkColor: string; customFields: any[] } = {
    qrDataString: '',
    darkColor: '#000000',
    customFields: [],
  };

  themes = [
    { id: 'modern', name: 'Modern' },
    { id: 'classic', name: 'Classic' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'professional', name: 'Professional' },
  ];

  fontSizes = [
    { id: 'small', name: 'Small' },
    { id: 'medium', name: 'Medium' },
    { id: 'large', name: 'Large' },
  ];

  leftColumnSkillGroups: SkillGroup[] = [];
  rightColumnSkillGroups: SkillGroup[] = [];
  personalDetails: PersonalDetails = {};
  isPersonalDetailsEmpty = false;

  declaration: DeclarationDef = { enabled: false, text: '' };
  private subscription: Subscription = new Subscription();

  protected resumeService = inject(ResumeService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.generateMarkdown();

    // pdfMake.vfs = pdfFonts.vfs;
    (pdfMake as any).default.vfs = (pdfFonts as any).vfs;

    // Load signature preferences
    const signaturePreference = localStorage.getItem('resumeSignatureLine');
    if (signaturePreference !== null) {
      this.includeSignatureLine = signaturePreference === 'true';
    }

    const digitalSignaturePreference = localStorage.getItem('resumeDigitalSignature');
    if (digitalSignaturePreference !== null) {
      this.useDigitalSignature = digitalSignaturePreference === 'true';
    }

    // Load saved signature image if it exists
    const savedSignatureImage = localStorage.getItem('resumeSignatureImage');
    if (savedSignatureImage) {
      this.signatureImageUrl = savedSignatureImage;
    }

    // Load icon preference
    const showIconsPreference = localStorage.getItem('resumeShowContactIcons');
    if (showIconsPreference !== null) {
      this.showContactIcons = showIconsPreference === 'true';
    }

    // Load hyperlink display preference
    const hyperlinkPreference = localStorage.getItem('resumeShowHyperlinkUrls');
    if (hyperlinkPreference !== null) {
      this.showHyperlinkUrls = hyperlinkPreference === 'true';
    }

    // Load QR code preferences
    const qrCodePreference = localStorage.getItem('resumeIncludeQrCode');
    if (qrCodePreference !== null) {
      this.includeQrCode = qrCodePreference === 'true';
    }

    const qrCodeSize = localStorage.getItem('resumeQrCodeSize');
    if (qrCodeSize) {
      this.qrCodeSize = qrCodeSize;
    }

    // Get initial QR code data
    this.qrData = this.resumeService.getQrCodeData();

    // Subscribe to QR code data updates
    this.resumeService.qrCodeData$.subscribe(data => {
      this.qrData = data;
    });

    // Subscribe to declaration changes
    this.subscription.add(
      this.resumeService.declaration$.subscribe(declaration => {
        this.declaration = declaration;
      }),
    );

    this.destroyRef.onDestroy(() => {
      // Clean up subscriptions
      this.subscription.unsubscribe();
    });

    // Get skills data as SkillGroup array
    const skillGroups: SkillGroup[] = this.resumeService.getSkills();

    // Split skill groups between columns
    skillGroups.forEach((skillGroup, index) => {
      if (index % 2 === 0) {
        this.leftColumnSkillGroups.push(skillGroup);
      } else {
        this.rightColumnSkillGroups.push(skillGroup);
      }
    });

    this.personalDetails = this.resumeService.getPersonalDetails();
    this.isPersonalDetailsEmpty = Object.keys(this.personalDetails).length === 0;
  }

  private async getIconFromPublicFolder(iconName: string): Promise<string> {
    try {
      // Path to icons in public directory - adjust path as needed
      const iconPath = `/icons/${iconName}.svg`;

      // Convert image to data URL that pdfMake can use
      return await this.getImageDataUrl(iconPath);
    } catch (error) {
      console.error(`Error loading icon '${iconName}':`, error);
      return ''; // Return empty string on error which will skip the icon
    }
  }

  private addDeclarationSection(docDefinition: any, colors: ThemeColors): void {
    if (this.declaration.enabled && this.declaration.text) {
      docDefinition.content.push({
        text: this.declaration.text,
        style: {
          fontSize: 10,
          italics: true,
          color: colors.textColor || '#444444',
        },
        margin: [0, 15, 0, 10],
      });
    }
  }

  saveSignaturePreference(): void {
    localStorage.setItem('resumeSignatureLine', this.includeSignatureLine.toString());
    localStorage.setItem('resumeDigitalSignature', this.useDigitalSignature.toString());

    // If signature line is unchecked, also uncheck digital signature
    if (!this.includeSignatureLine) {
      this.useDigitalSignature = false;
    }
  }

  onSignatureImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.signatureImageUrl = e.target.result;
        if (this.signatureImageUrl !== null) {
          localStorage.setItem('resumeSignatureImage', this.signatureImageUrl);
        }
      };

      reader.readAsDataURL(file);
    }
  }

  saveIconPreference(): void {
    localStorage.setItem('resumeShowContactIcons', this.showContactIcons.toString());
  }

  saveHyperlinkPreference(): void {
    localStorage.setItem('resumeShowHyperlinkUrls', this.showHyperlinkUrls.toString());
  }

  removeSignatureImage(): void {
    this.signatureImageUrl = null;
    localStorage.removeItem('resumeSignatureImage');
  }

  // Save QR code preferences
  saveQrCodePreference(): void {
    localStorage.setItem('resumeIncludeQrCode', this.includeQrCode.toString());
    localStorage.setItem('resumeQrCodeSize', this.qrCodeSize);
  }

  // Get QR code size based on selection
  getQrCodeSize(): number {
    switch (this.qrCodeSize) {
      case 'small':
        return 80;
      case 'large':
        return 120;
      case 'medium':
      default:
        return 100;
    }
  }

  generateMarkdown(): void {
    // Generate markdown directly in the component to have more control
    const profile = this.resumeService.getProfile();
    const skills = this.resumeService.getSkills();
    const experiences = this.resumeService.getExperiences();
    const education = this.resumeService.getEducation();
    const projects = this.resumeService.getProjects();
    const certificates = this.resumeService.getCertificates();
    const languages = this.resumeService.getLanguages();
    const personalDetails = this.resumeService.getPersonalDetails();
    const about = this.resumeService.getAbout();

    let markdown = '';

    // Header with name and title
    if (profile) {
      markdown += `# ${profile.fullName}\n`;
      if (profile.title) markdown += `## ${profile.title}\n`;

      // Contact information with emojis instead of icons
      const contactLines = [];
      if (profile.email) contactLines.push(`📧 ${profile.email}`);
      if (profile.phone) contactLines.push(`📱 ${profile.phone}`);
      if (profile.location) contactLines.push(`📍 ${profile.location}`);

      if (contactLines.length > 0) {
        markdown += '\n' + contactLines.join(' | ') + '\n';
      }

      // Social links with emojis
      const socialLines = [];
      if (profile.linkedin) socialLines.push(`[💼 LinkedIn](${profile.linkedin})`);
      if (profile.github) socialLines.push(`[💻 GitHub](${profile.github})`);
      if (profile.portfolio) socialLines.push(`[🌐 Portfolio](${profile.portfolio})`);

      if (socialLines.length > 0) {
        markdown += '\n' + socialLines.join(' | ') + '\n';
      }
    }

    // About section
    if (about) {
      markdown += '\n## About\n\n';
      markdown += about + '\n';
    }

    // Skills section
    if (skills?.length) {
      markdown += '\n## Skills\n\n';
      skills.forEach((skillGroup: { category: any; skills: any[] }) => {
        markdown += `### ${skillGroup.category}\n`;
        markdown += skillGroup.skills.join(', ') + '\n\n';
      });
    }

    // Experience section
    if (experiences?.length) {
      markdown += '\n## Experience\n\n';
      experiences.forEach(
        (exp: {
          position: any;
          company: any;
          startDate: any;
          endDate: any;
          location: any;
          description: string;
          achievements: any[];
        }) => {
          markdown += `### ${exp.position}\n`;
          markdown += `*${exp.company}* | ${exp.startDate} - ${exp.endDate || 'Present'}`;
          if (exp.location) markdown += ` | ${exp.location}`;
          markdown += '\n\n';

          if (exp.description) {
            markdown += exp.description + '\n\n';
          }

          if (exp.achievements?.length) {
            exp.achievements.forEach(achievement => {
              markdown += `- ${achievement}\n`;
            });
            markdown += '\n';
          }
        },
      );
    }

    // Projects section
    if (projects?.length) {
      markdown += '\n## Projects\n\n';
      projects.forEach((project: { name: any; link: any; description: string; technologies: any }) => {
        markdown += `### ${project.name}`;
        if (project.link) markdown += ` [🔗](${project.link})`;
        markdown += '\n\n';

        markdown += project.description + '\n\n';

        if (project.technologies) {
          markdown += `**Technologies:** ${project.technologies}\n\n`;
        }
      });
    }

    // Education section
    if (education?.length) {
      markdown += '\n## Education\n\n';
      education.forEach(
        (edu: {
          degree: any;
          institution: any;
          startDate: any;
          endDate: any;
          location: any;
          cgpa: any;
          description: string;
        }) => {
          markdown += `### ${edu.degree}\n`;
          markdown += `*${edu.institution}* | ${edu.startDate} - ${edu.endDate}`;
          if (edu.location) markdown += ` | ${edu.location}`;
          markdown += '\n\n';

          if (edu.cgpa) {
            markdown += `**CGPA/Percentage:** ${edu.cgpa}\n\n`;
          }

          if (edu.description) {
            markdown += edu.description + '\n\n';
          }
        },
      );
    }

    // Certifications section
    if (certificates?.length) {
      markdown += '\n## Certifications\n\n';
      certificates.forEach(cert => {
        markdown += `### ${cert.name}\n`;
        markdown += `*${cert.issuer}* | ${cert.date}`;
        if (cert.expiration) markdown += ` - ${cert.expiration}`;
        markdown += '\n\n';

        if (cert.credentialId) {
          markdown += `**Credential ID:** ${cert.credentialId}\n\n`;
        }

        if (cert.url) {
          markdown += `**URL:** [${cert.url}](${cert.url})\n\n`;
        }

        if (cert.description) {
          markdown += cert.description + '\n\n';
        }
      });
    }

    // Languages section
    if (languages?.length) {
      markdown += '\n## Languages\n\n';
      const languagesList = languages.map(lang => `- ${lang.name} (${lang.proficiency})`);
      markdown += languagesList.join('\n') + '\n';
    }

    // Personal details section
    if (personalDetails && Object.keys(personalDetails).length > 0) {
      markdown += '\n## Personal Details\n\n';

      const addDetail = (label: string, value: any) => {
        if (value) markdown += `**${label}:** ${value}\n\n`;
      };

      addDetail('Date of Birth', personalDetails.dateOfBirth);
      addDetail('Place of Birth', personalDetails.placeOfBirth);
      addDetail('Nationality', personalDetails.nationality);
      addDetail('Gender', personalDetails.gender);
      addDetail('Marital Status', personalDetails.maritalStatus);

      // Check if person is female and married
      const isMarriedFemale = personalDetails.gender === 'Female' && personalDetails.maritalStatus === 'Married';

      if (isMarriedFemale && personalDetails.husbandName) {
        addDetail("Husband's Name", personalDetails.husbandName);
      } else if (personalDetails.fathersName) {
        addDetail("Father's Name", personalDetails.fathersName);
      }

      if (!isMarriedFemale && personalDetails.mothersName) {
        addDetail("Mother's Name", personalDetails.mothersName);
      }

      addDetail('Religion', personalDetails.religion);
      addDetail('Passport Number', personalDetails.passportNumber);
      addDetail('Driving License', personalDetails.drivingLicense);
      addDetail('Blood Group', personalDetails.bloodGroup);

      if (personalDetails.hobbies?.length) {
        addDetail('Hobbies', personalDetails.hobbies.join(', '));
      }

      // Add additional custom fields
      if (personalDetails.otherInfo && personalDetails.otherInfo.length > 0) {
        personalDetails.otherInfo.forEach((info: any) => {
          addDetail(info.key, info.value);
        });
      }
    }

    this.markdownContent = markdown;
  }

  // In export service
  private addGeneralSections(docDefinition: any, colors: ThemeColors): void {
    const generalSections = this.resumeService.getGeneralSections();

    if (!generalSections || generalSections.length === 0) {
      return;
    }

    // Process each section
    generalSections.forEach(section => {
      if (!section.sectionName || section.entries.length === 0) return;

      // Add section header
      docDefinition.content.push({
        text: section.sectionName,
        style: 'subheader',
        color: colors.primaryColor,
        margin: [0, 15, 0, 0], // [left, top, right, bottom]
      });

      this.addSectionTitleLine(docDefinition, colors); // Add line below title

      // Add each entry in this section
      section.entries.forEach(entry => {
        // Create title and date row
        docDefinition.content.push({
          columns: [
            {
              text: entry.title,
              style: 'sectionTitle',
              width: '*',
            },
            {
              text: this.formatDate(entry),
              alignment: 'right',
              width: 'auto',
              style: 'dateText',
            },
          ],
          margin: [0, 0, 0, 5],
        });

        // Add location if present
        if (entry.location) {
          docDefinition.content.push({
            text: entry.location,
            style: 'smallText',
            italics: true,
            color: colors.subtitleColor,
          });
        }

        // Add description if present
        if (entry.description) {
          docDefinition.content.push({
            text: entry.description,
            style: 'normalText',
            color: colors.textColor,
            margin: [0, 0, 0, 5], // [left, top, right, bottom]
          });
        }
      });
    });
  }

  // Helper method to group sections
  private groupBy(array: any[], key: string): any {
    return array.reduce((result, item) => {
      (result[item[key]] = result[item[key]] || []).push(item);
      return result;
    }, {});
  }

  // Format date for display in PDF
  private formatDate(entry: SectionEntry): string {
    // If currentPosition is true, show "Start Date - Present"
    if (entry.currentPosition) {
      return entry.startDate ? `${this.formatSingleDate(entry.startDate)} - Present` : 'Present';
    }

    // If both dates exist
    if (entry.startDate && entry.endDate) {
      return `${this.formatSingleDate(entry.startDate)} - ${this.formatSingleDate(entry.endDate)}`;
    }
    // If only start date exists
    else if (entry.startDate) {
      return this.formatSingleDate(entry.startDate);
    }
    // If only end date exists
    else if (entry.endDate) {
      return this.formatSingleDate(entry.endDate);
    }
    // No dates
    return '';
  }

  private formatSingleDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return `${month} ${year}`;
  }

  copyMarkdown(): void {
    // First ensure we have the latest content
    this.generateMarkdown();

    navigator.clipboard.writeText(this.markdownContent).then(
      () => {
        this.showMessage('Markdown copied to clipboard');
      },
      () => {
        this.showMessage('Failed to copy. Please try again.');
      },
    );
  }

  exportAsPDF(): void {
    this.isGeneratingPDF = true;
    this.exportMessage = '';
    this.showMessage('Creating ATS-friendly PDF...');

    // Get filename or use default
    const filename = this.exportFilename
      ? this.exportFilename.trim()
      : `${this.resumeService.getProfile()?.fullName || 'Resume'}_${new Date().toISOString().slice(0, 10)}`;

    // Add .pdf extension if not present
    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // Convert resume to pdfmake document definition
    this.createPdfDefinition()
      .then(docDefinition => {
        // Create and download the PDF
        pdfMake.createPdf(docDefinition).download(finalFilename);

        this.isGeneratingPDF = false;
        this.showMessage('ATS-friendly PDF downloaded successfully');
      })
      .catch(error => {
        console.error('Error generating PDF:', error);
        this.isGeneratingPDF = false;
        this.showMessage('Error creating PDF. Please try again.');
      });
  }

  exportAsWord(): void {
    // Get filename or use default
    const filename = this.exportFilename
      ? this.exportFilename.trim()
      : `${this.resumeService.getProfile()?.fullName || 'Resume'}_${new Date().toISOString().slice(0, 10)}`;

    // Add .docx extension if not present
    const finalFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;

    const profile = this.resumeService.getProfile();
    const skills = this.resumeService.getSkills();
    const experiences = this.resumeService.getExperiences();
    const education = this.resumeService.getEducation();
    const projects = this.resumeService.getProjects();
    const certificates = this.resumeService.getCertificates();
    const languages = this.resumeService.getLanguages();
    const personalDetails = this.resumeService.getPersonalDetails();
    const about = this.resumeService.getAbout();

    // Create HTML content with proper Word compatibility
    const preHtml = `<!DOCTYPE html>
    <html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="Microsoft Word">
      <meta name="Originator" content="Microsoft Word">
      <title>${profile?.fullName || 'Resume'}</title>
      <style>
        /* Base styles */
        body { 
          font-family: Arial, sans-serif; 
          width: 100%;
          margin: 0 auto;
          padding: 30px;
          line-height: 1.3;
          color: #333;
        }
        
        /* Header styles */
        .header { 
          text-align: center;
          margin-bottom: 15px;
        }
        .header h1 { 
          font-size: 24pt;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header h2 {
          font-size: 14pt;
          font-weight: normal;
          margin: 0;
          padding: 0;
          color: #666;
        }
        .contact-info {
          text-align: center;
          margin: 8px 0;
          font-size: 11pt;
        }
        .contact-info span {
          margin: 0 8px;
        }
        .social-links {
          text-align: center;
          margin-bottom: 15px;
          font-size: 11pt;
        }
        .social-links a {
          margin: 0 8px;
          color: #2980b9;
        }
        
        /* Section styles */
        h2 { 
          color: #444; 
          border-bottom: 1px solid #444;
          padding-bottom: 5px;
          font-size: 16pt;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        h3 {
          font-size: 14pt;
          margin: 15px 0 5px 0;
          color: #333;
        }
        p {
          margin: 5px 0;
        }
        
        /* Experience and Education styles */
        .org-header {
          margin-top: 12px;
        }
        .org-title {
          font-weight: bold;
          font-size: 13pt;
        }
        .org-date {
          font-style: italic;
          color: #666;
          float: right;
        }
        .org-subtitle {
          font-style: italic;
          color: #666;
          margin-bottom: 8px;
        }
        
        /* Lists */
        ul {
          margin-top: 5px;
          margin-bottom: 15px;
          padding-left: 25px;
        }
        li {
          margin-bottom: 5px;
        }
        
        /* Tables for skills and personal details */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        table td {
          padding: 5px;
          vertical-align: top;
        }
        .skills-table td:first-child {
          font-weight: bold;
          width: 30%;
        }
        
        /* Footer styles */
        .footer {
          margin-top: 30px;
          font-size: 10pt;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin-left: auto;
          padding-top: 5px;
          text-align: center;
        }
      </style>
    </head>
    <body>`;

    let contentHtml = '';

    // Add Profile Section
    if (profile) {
      contentHtml += `<div class="header">
        <h1>${profile.fullName || ''}</h1>
        <h2>${profile.title || ''}</h2>
        
        <div class="contact-info">
          ${profile.email ? `<span>${profile.email}</span>` : ''}
          ${profile.phone ? `<span>${profile.phone}</span>` : ''}
          ${profile.location ? `<span>${profile.location}</span>` : ''}
        </div>
        
        <div class="social-links">
          ${profile.linkedin ? `<a href="${profile.linkedin}">${this.showHyperlinkUrls ? profile.linkedin : 'LinkedIn'}</a>` : ''}
          ${profile.github ? `<a href="${profile.github}">${this.showHyperlinkUrls ? profile.github : 'GitHub'}</a>` : ''}
          ${profile.portfolio ? `<a href="${profile.portfolio}">${this.showHyperlinkUrls ? profile.portfolio : 'Portfolio'}</a>` : ''}
        </div>
      </div>`;
    }

    // Add About Section
    if (about) {
      contentHtml += `<h2>About</h2>
      <p>${about}</p>`;
    }

    // Add Skills Section
    if (skills && skills.length > 0) {
      contentHtml += `<h2>Skills</h2>
      <table class="skills-table">`;

      skills.forEach((skillGroup: { category: any; skills: any[] }) => {
        contentHtml += `<tr>
          <td>${skillGroup.category}</td>
          <td>${skillGroup.skills.join(', ')}</td>
        </tr>`;
      });

      contentHtml += `</table>`;
    }

    // Add Experience Section
    if (experiences && experiences.length > 0) {
      contentHtml += `<h2>Experience</h2>`;

      experiences.forEach(
        (exp: {
          startDate: any;
          endDate: any;
          position: any;
          company: any;
          location: string;
          description: any;
          achievements: any[];
        }) => {
          contentHtml += `<div class="org-header">
          <span class="org-date">${exp.startDate} - ${exp.endDate || 'Present'}</span>
          <div class="org-title">${exp.position}</div>
        </div>
        <div class="org-subtitle">${exp.company}${exp.location ? ' | ' + exp.location : ''}</div>
        ${exp.description ? `<p>${exp.description}</p>` : ''}`;

          if (exp.achievements && exp.achievements.length > 0) {
            contentHtml += `<ul>`;
            exp.achievements.forEach(achievement => {
              contentHtml += `<li>${achievement}</li>`;
            });
            contentHtml += `</ul>`;
          }
        },
      );
    }

    // Add Projects Section
    if (projects && projects.length > 0) {
      contentHtml += `<h2>Projects</h2>`;

      projects.forEach((project: { name: any; link: any; description: any; technologies: any }) => {
        contentHtml += `<h3>${project.name}
          ${project.link ? ` <a href="${project.link}">${this.showHyperlinkUrls ? project.link : 'View Project'}</a>` : ''}
        </h3>
        <p>${project.description}</p>
        ${project.technologies ? `<p><strong>Technologies:</strong> ${project.technologies}</p>` : ''}`;
      });
    }

    // Add Education Section
    if (education && education.length > 0) {
      contentHtml += `<h2>Education</h2>`;

      education.forEach(
        (edu: {
          startDate: any;
          endDate: any;
          degree: any;
          institution: any;
          location: string;
          cgpa: any;
          description: any;
        }) => {
          contentHtml += `<div class="org-header">
          <span class="org-date">${edu.startDate} - ${edu.endDate}</span>
          <div class="org-title">${edu.degree}</div>
        </div>
        <div class="org-subtitle">${edu.institution}${edu.location ? ' | ' + edu.location : ''}</div>
        ${edu.cgpa ? `<p><strong>CGPA/Percentage:</strong> ${edu.cgpa}</p>` : ''}
        ${edu.description ? `<p>${edu.description}</p>` : ''}`;
        },
      );
    }

    // Add Certificates Section
    if (certificates && certificates.length > 0) {
      contentHtml += `<h2>Certifications</h2>`;

      certificates.forEach(cert => {
        contentHtml += `<div class="org-header">
          <span class="org-date">${cert.date}${cert.expiration ? ` - ${cert.expiration}` : ''}</span>
          <div class="org-title">${cert.name}</div>
        </div>
        <div class="org-subtitle">${cert.issuer}</div>
        ${cert.credentialId ? `<p><strong>Credential ID:</strong> ${cert.credentialId}</p>` : ''}
        ${cert.url ? `<p><a href="${cert.url}">${cert.url}</a></p>` : ''}
        ${cert.description ? `<p>${cert.description}</p>` : ''}`;
      });
    }

    // Add Languages Section
    if (languages && languages.length > 0) {
      contentHtml += `<h2>Languages</h2>
      <p>${languages.map(lang => `${lang.name} (${lang.proficiency})`).join(', ')}</p>`;
    }

    // Add Personal Details Section
    if (personalDetails && Object.keys(personalDetails).length > 0) {
      contentHtml += `<h2>Personal Details</h2>
      <table class="details-table">`;

      // Helper function to add a row if the value exists
      const addDetailRow = (label: string, value: string | undefined) => {
        if (value) {
          contentHtml += `<tr>
            <td style="width: 30%; font-weight: bold;">${label}</td>
            <td>${value}</td>
          </tr>`;
        }
      };

      addDetailRow('Date of Birth', personalDetails.dateOfBirth);
      addDetailRow('Place of Birth', personalDetails.placeOfBirth);
      addDetailRow('Nationality', personalDetails.nationality);
      addDetailRow('Gender', personalDetails.gender);
      addDetailRow('Marital Status', personalDetails.maritalStatus);

      // Check if person is female and married
      const isMarriedFemale = personalDetails.gender === 'Female' && personalDetails.maritalStatus === 'Married';

      if (isMarriedFemale && personalDetails.husbandName) {
        addDetailRow("Husband's Name", personalDetails.husbandName);
      } else if (personalDetails.fathersName) {
        addDetailRow("Father's Name", personalDetails.fathersName);
      }

      if (!isMarriedFemale && personalDetails.mothersName) {
        addDetailRow("Mother's Name", personalDetails.mothersName);
      }

      addDetailRow('Religion', personalDetails.religion);
      addDetailRow('Passport Number', personalDetails.passportNumber);
      addDetailRow('Driving License', personalDetails.drivingLicense);
      addDetailRow('Blood Group', personalDetails.bloodGroup);

      if (personalDetails.hobbies && personalDetails.hobbies.length) {
        addDetailRow('Hobbies', personalDetails.hobbies.join(', '));
      }

      // Add additional custom fields
      if (personalDetails.otherInfo && personalDetails.otherInfo.length > 0) {
        personalDetails.otherInfo.forEach(info => {
          addDetailRow(info.key, info.value);
        });
      }

      contentHtml += `</table>`;
    }

    // Add Footer with Signature
    if (this.includeSignatureLine) {
      contentHtml += `<div class="footer">
        <div class="signature-line">Signature (${profile?.fullName || 'Candidate'})</div>
      </div>`;
    }

    const postHtml = '</body></html>';
    const html = preHtml + contentHtml + postHtml;

    // Save as MS Word document
    try {
      // Create Word doc blob with proper content type
      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword;charset=utf-8',
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Use .doc extension for better compatibility
      const docFilename = finalFilename.replace('.docx', '.doc');

      link.download = docFilename;
      link.click();
      URL.revokeObjectURL(url);

      this.showMessage('Word document downloaded');
    } catch (error) {
      console.error('Error exporting Word document:', error);
      this.showMessage('Error creating Word document');
    }
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  showMessage(message: string): void {
    this.exportMessage = message;
    setTimeout(() => {
      this.exportMessage = '';
    }, 3000);
  }

  hasPersonalDetails(): boolean {
    const details = this.resumeService.getPersonalDetails();
    return !!details && Object.keys(details).length > 0;
  }

  isMarriedFemale(): boolean {
    const details = this.resumeService.getPersonalDetails();
    return details?.gender === 'Female' && details?.maritalStatus === 'Married';
  }

  // This method creates the pdfmake document definition
  private async createPdfDefinition(): Promise<any> {
    // Get color scheme based on theme
    const colors = this.getThemeColors();

    // Set base font size based on selected size
    const baseFontSize = this.getFontSize();

    // Create document definition
    const docDefinition: PdfDocDefinition = {
      content: [],
      info: {
        title: `Resume - ${this.exportFilename || 'Anand'}`,
        author: 'Anand Raja',
        subject: 'Professional Resume',
        keywords: this.getResumeKeywords(),
        creator: 'Resume Builder App - Anand',
        producer: 'Resume Builder App -Anand',
        creationDate: new Date(),
      },
      defaultStyle: {
        // Use default Roboto font instead of Helvetica
        fontSize: baseFontSize,
        lineHeight: 1.3,
        color: colors.textColor,
      },
      styles: {
        header: {
          fontSize: baseFontSize * 1.8,
          bold: true,
          color: colors.primaryColor,
          margin: [0, 0, 0, 5],
        },
        subheader: {
          fontSize: baseFontSize * 1.4,
          bold: true,
          color: colors.primaryColor,
          margin: [0, 10, 0, 0],
        },
        sectionTitle: {
          fontSize: baseFontSize * 1.2,
          bold: true,
          color: colors.secondaryColor,
          margin: [0, 8, 0, 4],
        },
        normalText: {
          fontSize: baseFontSize,
          margin: [0, 2, 0, 2],
          color: colors.textColor,
        },
        smallText: {
          fontSize: baseFontSize * 0.9,
          margin: [0, 1, 0, 1],
          color: colors.subtitleColor,
        },
        listItem: {
          margin: [0, 2, 0, 2],
          color: colors.textColor,
        },
        dateText: {
          fontSize: baseFontSize * 0.9,
          margin: [0, 1, 0, 1],
          color: colors.subtitleColor,
          italics: true, // Make dates italicized to match preview
        },
      },
      tableLayouts: {
        skillsLayout: {
          hLineWidth: function (i: number, node: any): number {
            return 0.5;
          },
          vLineWidth: function (i: number, node: any): number {
            return 0.5;
          },
          hLineColor: function (i: number, node: any): string {
            return '#e0e0e0';
          },
          vLineColor: function (i: number, node: any): string {
            return '#e0e0e0';
          },
          paddingLeft: function (i: number, node: any): number {
            return 2;
          },
          paddingRight: function (i: number, node: any): number {
            return 2;
          },
          paddingTop: function (i: number, node: any): number {
            return 2;
          },
          paddingBottom: function (i: number, node: any): number {
            return 2;
          },
        },
      },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
    };

    // Add profile section
    await this.addProfileSection(docDefinition, colors);

    // Add about section
    this.addAboutSection(docDefinition, colors);

    // Add skills section
    this.addSkillsSection(docDefinition, colors);

    // Add experience section
    this.addExperienceSection(docDefinition, colors);

    // Add projects section
    this.addProjectsSection(docDefinition, colors);

    // Add education section
    this.addEducationSection(docDefinition, colors);

    // Add certificates section
    this.addCertificatesSection(docDefinition, colors);

    // Add languages section
    this.addLanguagesSection(docDefinition, colors);

    // Add general sections
    this.addGeneralSections(docDefinition, colors);

    // Add personal details section
    this.addPersonalDetailsSection(docDefinition, colors);

    this.addDeclarationSection(docDefinition, colors);

    // Add footer with QR code and signature
    await this.addFooterSection(docDefinition);

    return docDefinition;
  }

  // Add certificates section
  private addCertificatesSection(docDefinition: any, colors: any): void {
    const certificates = this.resumeService.getCertificates();
    if (!certificates?.length) return;

    docDefinition.content.push({ text: 'Certifications', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors);

    certificates.forEach((cert: any) => {
      // Certificate name and date
      docDefinition.content.push({
        columns: [
          {
            text: cert.name,
            style: 'sectionTitle',
            width: '*',
          },
          {
            text: cert.date + (cert.expiration ? ` - ${cert.expiration}` : ''),
            style: 'dateText',
            width: 'auto',
            alignment: 'right',
          },
        ],
        margin: [0, 5, 0, 0],
      });

      // Issuer
      docDefinition.content.push({
        text: cert.issuer,
        style: 'smallText',
        italics: true,
        color: colors.subtitleColor,
        margin: [0, 0, 0, 3],
      });

      // Credential ID if available
      if (cert.credentialId) {
        docDefinition.content.push({
          text: [{ text: 'Credential ID: ', bold: true }, cert.credentialId],
          style: 'smallText',
          margin: [0, 3, 0, 0],
        });
      }

      // URL if available
      if (cert.url) {
        docDefinition.content.push({
          text: cert.url,
          link: cert.url,
          style: 'smallText',
          color: colors.accentColor,
          margin: [0, 3, 0, 0],
        });
      }

      // Description if available
      if (cert.description) {
        docDefinition.content.push({
          text: cert.description,
          style: 'normalText',
          margin: [0, 3, 0, 10],
        });
      } else {
        // Add spacing after the certificate
        docDefinition.content.push({ text: '', margin: [0, 0, 0, 10] });
      }
    });
  }

  private getResumeKeywords(): string {
    const skills = this.resumeService.getSkills();
    const profile = this.resumeService.getProfile();
    const keywords = [];

    // Add job title if available
    if (profile?.title) {
      keywords.push(profile.title);
    }

    // Add top skills from each category
    if (skills?.length) {
      skills.forEach((skillGroup: { skills: string | any[] }) => {
        if (skillGroup.skills?.length) {
          // Add first 3 skills from each category
          const topSkills = skillGroup.skills.slice(0, 3);
          keywords.push(...topSkills);
        }
      });
    }

    return keywords.join(', ');
  }

  // Add languages section
  private addLanguagesSection(docDefinition: any, colors: any): void {
    const languages = this.resumeService.getLanguages();
    if (!languages?.length) return;

    docDefinition.content.push({ text: 'Languages', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors);

    // Create text array with different colors for languages and proficiency levels
    const languageTexts: { text: any; color: any }[] = [];

    languages.forEach((lang: any, index: number) => {
      // Add language name in normal text color
      languageTexts.push({
        text: lang.name,
        color: colors.textColor,
      });

      // Add proficiency in parentheses with subtitle color
      languageTexts.push({
        text: ` (${lang.proficiency})`,
        color: colors.subtitleColor,
      });

      // Add comma separator except for the last item
      if (index < languages.length - 1) {
        languageTexts.push({ text: ', ', color: colors.textColor });
      }
    });

    docDefinition.content.push({
      text: languageTexts,
      style: 'normalText',
      margin: [0, 0, 0, 10],
    });
  }

  // Add personal details section
  private addPersonalDetailsSection(docDefinition: any, colors: ThemeColors): void {
    // const personalDetails = this.resumeService.getPersonalDetails();
    // if (!personalDetails || Object.keys(personalDetails).length === 0) return;
    if (!this.personalDetails || this.isPersonalDetailsEmpty) return;

    docDefinition.content.push({ text: 'Personal Details', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors);

    // Create a two-column layout for personal details
    docDefinition.content.push(this.createTwoColumnPersonalDetailsTable(this.personalDetails, colors));
  }

  private createTwoColumnPersonalDetailsTable(personalDetails: any, colors: ThemeColors): any {
    // First collect all detail rows
    const allDetails = this.collectPersonalDetails(personalDetails);

    // Calculate middle index to split details into two columns
    const halfIndex = Math.ceil(allDetails.length / 2);

    // Split details into left and right columns
    const leftColumnDetails = allDetails.slice(0, halfIndex);
    const rightColumnDetails = allDetails.slice(halfIndex);

    // Create left column table
    const leftTable = {
      table: {
        widths: ['40%', '5%', '55%'], // Label, colon, value
        body: this.createDetailRows(leftColumnDetails, colors),
      },
      layout: 'noBorders',
    };

    // Create right column table
    const rightTable = {
      table: {
        widths: ['40%', '5%', '55%'], // Label, colon, value
        body: this.createDetailRows(rightColumnDetails, colors),
      },
      layout: 'noBorders',
    };

    // Return a columns layout containing both tables
    return {
      columns: [
        { width: '48%', stack: [leftTable] },
        { width: '4%', text: '' }, // Spacer column
        { width: '48%', stack: [rightTable] },
      ],
      margin: [0, 0, 0, 10],
    };
  }

  private collectPersonalDetails(personalDetails: any): Array<[string, string]> {
    const details: Array<[string, string]> = [];

    // Helper function to add a detail if value exists
    const addDetail = (label: string, value: any) => {
      if (value) details.push([label, value]);
    };

    // Basic details
    addDetail('Date of Birth', personalDetails.dateOfBirth);
    addDetail('Place of Birth', personalDetails.placeOfBirth);
    addDetail('Nationality', personalDetails.nationality);
    addDetail('Gender', personalDetails.gender);
    addDetail('Marital Status', personalDetails.maritalStatus);

    // Family details - handle married females differently
    const isMarriedFemale = personalDetails.gender === 'Female' && personalDetails.maritalStatus === 'Married';

    if (isMarriedFemale && personalDetails.husbandName) {
      addDetail("Husband's Name", personalDetails.husbandName);
    } else if (personalDetails.fathersName) {
      addDetail("Father's Name", personalDetails.fathersName);
    }

    if (!isMarriedFemale && personalDetails.mothersName) {
      addDetail("Mother's Name", personalDetails.mothersName);
    }

    // Siblings
    if (personalDetails.hasSiblings === true && (personalDetails.siblingCount ?? 0) > 0) {
      addDetail('Number of Siblings', (personalDetails.siblingCount ?? 0).toString());
    }

    // Other details
    addDetail('Religion', personalDetails.religion);
    addDetail('Passport Number', personalDetails.passportNumber);
    addDetail('Driving License', personalDetails.drivingLicense);
    addDetail('Blood Group', personalDetails.bloodGroup);

    if (personalDetails.hobbies && personalDetails.hobbies.length) {
      addDetail('Hobbies', personalDetails.hobbies.join(', '));
    }

    // Custom fields
    if (personalDetails.otherInfo && personalDetails.otherInfo.length > 0) {
      personalDetails.otherInfo.forEach((info: any) => {
        addDetail(info.key, info.value);
      });
    }

    return details;
  }

  private createDetailRows(details: Array<[string, string]>, colors: ThemeColors): any[] {
    return details.map(([label, value]) => [
      { text: label, style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
      { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
      { text: value, style: 'smallText', color: colors.textColor },
    ]);
  }

  // Add a helper method to create a line below section titles
  private addSectionTitleLine(docDefinition: any, colors: any): void {
    docDefinition.content.push({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515, // Width of content area
          y2: 0,
          lineWidth: 0.7, // line thickness
          lineColor: colors.primaryColor, // Use primary color to match the title
        },
      ],
      margin: [0, 0, 0, 8], // Smaller margins than section dividers
    });
  }

  // Helper method for theme colors
  private getThemeColors(): ThemeColors {
    switch (this.selectedTheme) {
      case 'modern':
        return {
          primaryColor: '#3498db', // Blue for headings and lines
          secondaryColor: '#2c3e50', // Dark blue for section titles
          accentColor: '#2980b9', // Medium blue for links
          textColor: '#333333', // Near-black for normal text
          subtitleColor: '#7f8c8d', // Gray for dates and small text
          lineColor: '#3498db', // Make sure section lines match the primary color
          lightShade: '#f5f5f5',
          ultraLightShade: '#f9f9f9',
        };
      case 'classic':
        return {
          primaryColor: '#000000', // Pure black for headings
          secondaryColor: '#333333', // Dark gray for section titles
          accentColor: '#666666', // Medium gray for links
          textColor: '#000000', // Black for normal text
          subtitleColor: '#555555', // Gray for dates and small text
          lineColor: '#000000', // Black for section lines
          lightShade: '#f5f5f5',
          ultraLightShade: '#f9f9f9',
        };
      case 'minimal':
        return {
          primaryColor: '#333333', // Dark gray for headings
          secondaryColor: '#555555', // Medium gray for section titles
          accentColor: '#777777', // Light gray for links
          textColor: '#333333', // Dark gray for normal text
          subtitleColor: '#7f8c8d', // Lighter gray for dates and small text
          lineColor: '#333333', // Match heading color for lines
          lightShade: '#f5f5f5',
          ultraLightShade: '#f9f9f9',
        };
      case 'professional':
        return {
          primaryColor: '#2c3e50', // Dark blue for headings
          secondaryColor: '#34495e', // Medium blue for section titles
          accentColor: '#2980b9', // Lighter blue for links
          textColor: '#333333', // Near-black for normal text
          subtitleColor: '#7f8c8d', // Gray for dates and small text
          lineColor: '#2c3e50', // Match heading color for lines
          lightShade: '#f5f5f5',
          ultraLightShade: '#f9f9f9',
        };
      default:
        return {
          primaryColor: '#000000',
          secondaryColor: '#333333',
          accentColor: '#666666',
          textColor: '#000000',
          subtitleColor: '#555555',
          lineColor: '#000000',
          lightShade: '#f5f5f5',
          ultraLightShade: '#f9f9f9',
        };
    }
  }

  // Helper method for font size
  private getFontSize(): number {
    switch (this.selectedFontSize) {
      case 'small':
        return 9;
      case 'large':
        return 11;
      case 'medium':
      default:
        return 10;
    }
  }

  // Profile section with photo and contact info
  private async addProfileSection(docDefinition: any, colors: any): Promise<void> {
    const profile = this.resumeService.getProfile();
    if (!profile) return;

    // Convert profile photo to data URL if it exists
    let photoDataUrl = null;
    if (profile.photoUrl && this.resumePreview) {
      const img = this.resumePreview.nativeElement.querySelector('.profile-photo');
      if (img) {
        try {
          photoDataUrl = await this.getImageDataUrl(profile.photoUrl);
        } catch (e) {
          console.error('Error loading profile photo:', e);
        }
      }
    }

    // Create profile header section
    const profileSection: any[] = [];

    // If we have a photo, create a 2-column layout
    if (photoDataUrl) {
      profileSection.push({
        columns: [
          // Left column with photo
          {
            width: 'auto',
            stack: [
              {
                image: photoDataUrl,
                width: 70,
                height: 70,
                fit: [70, 70],
              },
            ],
            margin: [0, 0, 15, 0],
          },
          // Right column with name, title and contact info
          {
            width: '*',
            stack: [
              // Name and title centered within this column
              { text: profile.fullName, style: 'header', alignment: 'center' },
              { text: profile.title, style: 'normalText', margin: [0, -5, 0, 10], alignment: 'center' },
              // Contact info and links remain left-aligned
              await this.createContactInfo(profile),
              await this.createProfileLinks(profile, colors),
            ],
          },
        ],
        margin: [0, 0, 0, 15],
      });
    } else {
      // No photo, center everything within the page
      profileSection.push(
        { text: profile.fullName, style: 'header', alignment: 'center' },
        { text: profile.title, style: 'normalText', margin: [0, -5, 0, 10], alignment: 'center' },
        await this.createContactInfo(profile),
        await this.createProfileLinks(profile, colors),
      );
    }

    docDefinition.content.push(...profileSection);
  }

  // Create contact info row
  private async createContactInfo(profile: any): Promise<any> {
    // If icons are disabled, use the existing implementation without bullet separators
    if (!this.showContactIcons) {
      const contactColumns = [];

      if (profile.email) {
        contactColumns.push({
          text: profile.email,
          style: 'smallText',
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }

      if (profile.phone) {
        contactColumns.push({
          text: profile.phone,
          style: 'smallText',
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }

      if (profile.location) {
        contactColumns.push({
          text: profile.location,
          style: 'smallText',
          width: 'auto',
        });
      }

      if (contactColumns.length === 0) return null;

      return {
        columns: contactColumns,
        alignment: 'center',
        margin: [0, 0, 0, 5],
      };
    }

    // With icons enabled, create a horizontal row of contacts
    const contactColumns = [];

    // Add email with icon
    if (profile.email) {
      try {
        const emailIconUrl = await this.getIconFromPublicFolder('email');
        contactColumns.push({
          stack: [
            {
              columns: [
                {
                  width: 16,
                  image: emailIconUrl,
                  fit: [12, 12],
                  alignment: 'center',
                },
                {
                  width: 'auto',
                  text: profile.email,
                  style: 'smallText',
                  margin: [5, 0, 0, 0],
                },
              ],
            },
          ],
          width: 'auto',
          margin: [0, 0, 20, 0], // Add right margin for spacing between items
        });
      } catch (e) {
        contactColumns.push({
          text: profile.email,
          style: 'smallText',
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }
    }

    // Add phone with icon
    if (profile.phone) {
      try {
        const phoneIconUrl = await this.getIconFromPublicFolder('phone');
        contactColumns.push({
          stack: [
            {
              columns: [
                {
                  width: 16,
                  image: phoneIconUrl,
                  fit: [12, 12],
                  alignment: 'center',
                },
                {
                  width: 'auto',
                  text: profile.phone,
                  style: 'smallText',
                  margin: [5, 0, 0, 0],
                },
              ],
            },
          ],
          width: 'auto',
          margin: [0, 0, 20, 0], // Add right margin for spacing between items
        });
      } catch (e) {
        contactColumns.push({
          text: profile.phone,
          style: 'smallText',
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }
    }

    // Add location with icon
    if (profile.location) {
      try {
        const locationIconUrl = await this.getIconFromPublicFolder('location');
        contactColumns.push({
          stack: [
            {
              columns: [
                {
                  width: 16,
                  image: locationIconUrl,
                  fit: [12, 12],
                  alignment: 'center',
                },
                {
                  width: 'auto',
                  text: profile.location,
                  style: 'smallText',
                  margin: [5, 0, 0, 0],
                },
              ],
            },
          ],
          width: 'auto',
        });
      } catch (e) {
        contactColumns.push({
          text: profile.location,
          style: 'smallText',
          width: 'auto',
        });
      }
    }

    if (contactColumns.length === 0) return null;

    return {
      columns: contactColumns,
      alignment: 'center',
      margin: [0, 0, 0, 5],
    };
  }

  // Create profile links row
  private async createProfileLinks(profile: any, colors: any): Promise<any> {
    // If showing URLs, filter which links to show based on portfolio presence
    let filteredProfile = { ...profile };

    if (this.showHyperlinkUrls) {
      filteredProfile = { ...profile };

      // If portfolio exists, show portfolio and LinkedIn (hide GitHub)
      if (profile.portfolio) {
        filteredProfile.github = null; // Hide GitHub
      }
      // If no portfolio, show LinkedIn and GitHub (keep both)
    }

    // If icons are disabled, use columns without bullet separators
    if (!this.showContactIcons) {
      const linkColumns = [];

      if (filteredProfile.github) {
        const text = this.showHyperlinkUrls ? filteredProfile.github : 'GitHub';
        linkColumns.push({
          text: text,
          link: filteredProfile.github,
          style: 'smallText',
          color: colors.accentColor,
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }

      if (filteredProfile.linkedin) {
        const text = this.showHyperlinkUrls ? filteredProfile.linkedin : 'LinkedIn';
        linkColumns.push({
          text: text,
          link: filteredProfile.linkedin,
          style: 'smallText',
          color: colors.accentColor,
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }

      if (filteredProfile.portfolio) {
        const text = this.showHyperlinkUrls ? filteredProfile.portfolio : 'Portfolio';
        linkColumns.push({
          text: text,
          link: filteredProfile.portfolio,
          style: 'smallText',
          color: colors.accentColor,
          width: 'auto',
        });
      }

      if (linkColumns.length === 0) return null;

      return {
        columns: linkColumns,
        alignment: 'center',
        margin: [0, 0, 0, 5],
      };
    }

    // With icons enabled, create a horizontal row of links
    const linkColumns = [];

    // Add GitHub with icon
    if (filteredProfile.github) {
      try {
        const githubIconUrl = await this.getIconFromPublicFolder('github');
        linkColumns.push({
          stack: [
            {
              columns: [
                {
                  width: 16,
                  image: githubIconUrl,
                  fit: [12, 12],
                  alignment: 'center',
                },
                {
                  width: 'auto',
                  text: this.showHyperlinkUrls ? filteredProfile.github : 'GitHub',
                  link: filteredProfile.github,
                  style: 'smallText',
                  color: colors.accentColor,
                  margin: [2, 0, 0, 0], // space between icon and text in profile links
                },
              ],
            },
          ],
          width: 'auto',
          margin: [0, 0, 20, 0], // Add right margin for spacing between items
        });
      } catch (e) {
        linkColumns.push({
          text: this.showHyperlinkUrls ? filteredProfile.github : 'GitHub',
          link: filteredProfile.github,
          style: 'smallText',
          color: colors.accentColor,
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }
    }

    // Add LinkedIn with icon
    if (filteredProfile.linkedin) {
      try {
        const linkedinIconUrl = await this.getIconFromPublicFolder('linkedin');
        linkColumns.push({
          stack: [
            {
              columns: [
                {
                  width: 16,
                  image: linkedinIconUrl,
                  fit: [12, 12],
                  alignment: 'center',
                },
                {
                  width: 'auto',
                  text: this.showHyperlinkUrls ? filteredProfile.linkedin : 'LinkedIn',
                  link: filteredProfile.linkedin,
                  style: 'smallText',
                  color: colors.accentColor,
                  margin: [2, 0, 0, 0],
                },
              ],
            },
          ],
          width: 'auto',
          margin: [0, 0, 20, 0], // Add right margin for spacing between items
        });
      } catch (e) {
        linkColumns.push({
          text: this.showHyperlinkUrls ? filteredProfile.linkedin : 'LinkedIn',
          link: filteredProfile.linkedin,
          style: 'smallText',
          color: colors.accentColor,
          width: 'auto',
          margin: [0, 0, 20, 0],
        });
      }
    }

    // Add Portfolio/website with icon
    if (filteredProfile.portfolio) {
      try {
        const websiteIconUrl = await this.getIconFromPublicFolder('website');
        linkColumns.push({
          stack: [
            {
              columns: [
                {
                  width: 16,
                  image: websiteIconUrl,
                  fit: [12, 12],
                  alignment: 'center',
                },
                {
                  width: 'auto',
                  text: this.showHyperlinkUrls ? filteredProfile.portfolio : 'Portfolio',
                  link: filteredProfile.portfolio,
                  style: 'smallText',
                  color: colors.accentColor,
                  margin: [2, 0, 0, 0],
                },
              ],
            },
          ],
          width: 'auto',
        });
      } catch (e) {
        linkColumns.push({
          text: this.showHyperlinkUrls ? filteredProfile.portfolio : 'Portfolio',
          link: filteredProfile.portfolio,
          style: 'smallText',
          color: colors.accentColor,
          width: 'auto',
        });
      }
    }

    if (linkColumns.length === 0) return null;

    return {
      columns: linkColumns,
      alignment: 'center',
      margin: [0, 0, 0, 5],
    };
  }

  // About section
  private addAboutSection(docDefinition: any, colors: any): void {
    const about = this.resumeService.getAbout();
    if (!about) return;

    docDefinition.content.push({ text: 'About', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors); // Add line below title

    docDefinition.content.push({ text: about, style: 'normalText', margin: [0, 0, 0, 10] });
  }

  // Skills section
  private addSkillsSection(docDefinition: any, colors: ThemeColors): void {
    const skillsData = this.resumeService.getSkills();
    if (!skillsData || (Array.isArray(skillsData) && skillsData.length === 0)) return;

    // Debug skills data structure
    console.log('Skills data received:', skillsData);

    // Add section header
    docDefinition.content.push({
      text: 'Skills',
      style: 'subheader',
      color: colors.primaryColor,
      // margin: [0, 15, 0, 10]
    });

    this.addSectionTitleLine(docDefinition, colors); // Add line below title

    // Handle different possible data structures for skills
    let skillCategories = [];

    // Case 1: Data is directly an array of categories
    if (Array.isArray(skillsData)) {
      skillCategories = skillsData;
    }
    // Case 2: Data has a categories property that's an array
    else if (skillsData && Array.isArray(skillsData.categories)) {
      skillCategories = skillsData.categories;
    }
    // Case 3: Data is an object with category names as keys
    else if (skillsData && typeof skillsData === 'object') {
      skillCategories = Object.keys(skillsData).map(categoryName => ({
        name: categoryName,
        skills: skillsData[categoryName],
      }));
    }

    // Create chunks of categories - 2 per row
    const categoryChunks = [];
    for (let i = 0; i < skillCategories.length; i += 2) {
      const chunk = skillCategories.slice(i, i + 2);
      categoryChunks.push(chunk);
    }

    // Process each chunk (row) of categories
    categoryChunks.forEach(chunk => {
      const row = {
        columns: [] as any[],
        columnGap: 10,
        margin: [0, 0, 0, 15],
      };

      // Process each category in this chunk
      chunk.forEach((category: SkillCategory | string) => {
        // Ensure we have the category name - use it directly if it's a string, or access the name property
        const categoryName: string =
          typeof category === 'string'
            ? category
            : category.name || category.category || category.title || 'Uncategorized Skills';

        console.log('Processing category:', categoryName);

        // Get the skills array, handling different possible structures
        let skills: string[] = [];
        if (typeof category !== 'string' && Array.isArray(category.skills)) {
          skills = category.skills;
        } else if (typeof category !== 'string' && typeof category.skills === 'string') {
          skills = category.skills.split(',').map(s => s.trim());
        } else if (typeof category !== 'string' && Array.isArray(category.items)) {
          // Try alternative property names
          skills = category.items;
        }

        // Create column for this category
        const column: SkillColumn = {
          width: '*',
          stack: [
            // Category header - use the extracted categoryName
            {
              text: categoryName,
              bold: true,
              fontSize: 10,
              fillColor: colors.lightShade || '#f5f5f5',
              color: colors.textColor,
              margin: [0, 0, 0, 5],
              padding: [5, 3, 5, 3],
            },
            // Skills container with border
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      stack: this.formatSkillItems(skills, colors),
                      margin: [3, 3, 3, 3],
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: (i: number) => 0.5,
                vLineWidth: (i: number) => 0.5,
                hLineColor: () => colors.lightShade || '#e0e0e0',
                vLineColor: () => colors.lightShade || '#e0e0e0',
              },
            },
          ],
        };

        row.columns.push(column);
      });

      // If we have just one category in this row, adjust width
      if (row.columns.length === 1) {
        row.columns[0].width = '50%';
      }

      // Add the row to document content
      docDefinition.content.push(row);
    });
  }

  // Helper method to format individual skill items
  private formatSkillItems(skills: string[], colors: ThemeColors): any[] {
    let pillColors: { background: string; text: string; border: string };

    if (this.useDefaultPillColors) {
      // Use default professional colors
      pillColors = {
        background: '#f0f9ff', // Light sky blue background
        text: '#0c4a6e', // Dark navy text
        border: '#bae6fd', // Light blue border
      };
    } else {
      // Use theme-based colors
      pillColors = {
        background: colors.ultraLightShade || '#f0f9ff',
        text: colors.primaryColor || '#0c4a6e',
        border: colors.lightShade || '#bae6fd',
      };
    }

    // You can replace with any of these professional combinations:
    // Default Blue:
    // background: '#f0f9ff', text: '#0c4a6e', border: '#bae6fd'

    // Subtle Professional:
    // background: '#f2f2f7', text: '#2c3e50', border: '#d1d5db'

    // Modern Tech:
    // background: '#eef2ff', text: '#3730a3', border: '#c7d2fe'

    // Subdued Gray:
    // background: '#f3f4f6', text: '#374151', border: '#d1d5db'

    // Soft Green:
    // background: '#ecfdf5', text: '#065f46', border: '#a7f3d0'

    const rows: any[] = [];
    const currentRow: { stack: any[]; margin: [number, number, number, number] } = {
      stack: [],
      margin: [0, 4, 0, 4],
    };

    const skillsWithCommas: (SkillPill | SkillComma)[] = [];

    skills.forEach((skill, index) => {
      // Create a pill for each skill with balanced vertical padding
      const skillPill = {
        text: skill,
        fontSize: 9,
        color: pillColors.text,
        background: pillColors.background,
        border: [0.75, 0.75, 0.75, 0.75] as [number, number, number, number],
        borderColor: pillColors.border,
        // Adjust padding to fix vertical centering (more on top, less on bottom)
        padding: [8, 4, 8, 2] as [number, number, number, number],
        margin: [0, 2, 0, 2] as [number, number, number, number],
      };

      // Add the pill
      skillsWithCommas.push(skillPill);

      // Add comma after each pill except the last one
      if (index < skills.length - 1) {
        skillsWithCommas.push({
          text: ', ',
          fontSize: 9,
          color: colors.textColor || '#333333',
          margin: [0, 0, 0, 0],
        });
      }
    });

    // Add all skills with commas to the row with adjusted line height
    currentRow.stack.push({
      text: skillsWithCommas,
      lineHeight: 1.3, // Reduced from 1.5 for better vertical spacing
    });

    rows.push(currentRow);
    return rows;
  }

  // Experience section
  private addExperienceSection(docDefinition: any, colors: any): void {
    const experiences = this.resumeService.getExperiences();
    if (!experiences?.length) return;

    docDefinition.content.push({ text: 'Experience', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors); // Add line below title

    experiences.forEach((exp: any) => {
      // Position and date in first row
      docDefinition.content.push({
        columns: [
          {
            text: exp.position,
            style: 'sectionTitle',
            width: '*',
          },
          {
            text: `${exp.startDate} - ${exp.endDate || 'Present'}`,
            style: 'dateText',
            width: 'auto',
            alignment: 'right',
          },
        ],
        margin: [0, 5, 0, 0],
      });

      // Company and location in second row (both left-aligned)
      docDefinition.content.push({
        text: [
          {
            text: exp.company,
            style: 'smallText',
            italics: true,
            color: colors.subtitleColor,
          },
          {
            text: exp.location ? ` | ${exp.location}` : '',
            style: 'smallText',
            italics: true,
            color: colors.subtitleColor,
          },
        ],
        margin: [0, 0, 0, 5],
      });

      // Add description
      if (exp.description) {
        docDefinition.content.push({
          text: exp.description,
          style: 'normalText',
          margin: [0, 0, 0, 5],
        });
      }

      // Add achievements as bullet points
      if (exp.achievements?.length) {
        const achievementList = {
          ul: exp.achievements.map((achievement: any) => ({
            text: achievement,
            style: 'listItem',
          })),
          margin: [15, 0, 0, 10],
        };

        docDefinition.content.push(achievementList);
      } else {
        // Add some spacing after the experience item
        docDefinition.content.push({ text: '', margin: [0, 0, 0, 10] });
      }
    });
  }

  // Projects section
  private addProjectsSection(docDefinition: any, colors: any): void {
    const projects = this.resumeService.getProjects();
    if (!projects?.length) return;

    docDefinition.content.push({ text: 'Projects', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors); // Add line below title

    projects.forEach((project: any) => {
      // Create project header with name and link
      const headerContent: any[] = [
        {
          text: project.name,
          style: 'sectionTitle',
          width: '*',
        },
      ];

      // Add link if available
      if (project.link) {
        headerContent.push({
          text: this.showHyperlinkUrls ? project.link : 'View Project',
          link: project.link,
          style: 'smallText',
          color: colors.accentColor,
          width: this.showHyperlinkUrls ? '33%' : 'auto',
          alignment: 'right',
        });
      }

      docDefinition.content.push({
        columns: headerContent,
        margin: [0, 5, 0, 0],
      });

      // Add description
      docDefinition.content.push({
        text: project.description,
        style: 'normalText',
        margin: [0, 3, 0, 3],
      });

      // Add technologies
      if (project.technologies) {
        docDefinition.content.push({
          text: [
            { text: 'Technologies: ', bold: true, color: colors.textColor },
            { text: project.technologies, color: colors.textColor },
          ],
          style: 'smallText',
          margin: [0, 7, 0, 10],
        });
      } else {
        // Add spacing after project
        docDefinition.content.push({ text: '', margin: [0, 0, 0, 10] });
      }
    });
  }

  // Education section
  private addEducationSection(docDefinition: any, colors: any): void {
    const educations = this.resumeService.getEducation();
    if (!educations?.length) return;

    docDefinition.content.push({ text: 'Education', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors); // Add line below title

    educations.forEach((edu: any) => {
      // Create education header with degree and date
      docDefinition.content.push({
        columns: [
          {
            text: edu.degree,
            style: 'sectionTitle',
            width: '*',
          },
          {
            text: `${edu.startDate} - ${edu.endDate}`,
            style: 'dateText',
            width: 'auto',
            alignment: 'right',
          },
        ],
        margin: [0, 5, 0, 0],
      });

      // Institution and location in second row (institution left, location right)
      docDefinition.content.push({
        columns: [
          {
            text: edu.institution,
            style: 'smallText',
            italics: true,
            color: colors.subtitleColor,
            width: '*',
          },
          {
            text: edu.location || '',
            style: 'smallText',
            italics: true,
            color: colors.subtitleColor,
            width: 'auto',
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 3],
      });

      // Add CGPA if available
      if (edu.cgpa) {
        docDefinition.content.push({
          text: [{ text: 'CGPA/Percentage: ', bold: true }, edu.cgpa],
          style: 'smallText',
          margin: [0, 3, 0, 3],
        });
      }

      // Add description if available
      if (edu.description) {
        docDefinition.content.push({
          text: edu.description,
          style: 'normalText',
          margin: [0, 0, 0, 10],
        });
      } else {
        // Add spacing after education item
        docDefinition.content.push({ text: '', margin: [0, 0, 0, 10] });
      }
    });
  }

  // Footer section with QR code and signature
  private async addFooterSection(docDefinition: any): Promise<void> {
    // Only add footer if we have either QR code or signature
    if (!this.includeQrCode && !this.includeSignatureLine) return;

    // Create footer content array
    const footerContent: any[] = [];

    // Add QR code if enabled
    if (this.includeQrCode && this.qrData.qrDataString) {
      // Get QR code data from the DOM element
      const qrCodeElement = this.resumePreview.nativeElement.querySelector('qrcode');
      let qrCodeDataUrl = null;

      if (qrCodeElement) {
        const canvas = qrCodeElement.querySelector('canvas');
        if (canvas) {
          qrCodeDataUrl = canvas.toDataURL('image/png');
        }
      }

      if (qrCodeDataUrl) {
        footerContent.push({
          stack: [
            {
              image: qrCodeDataUrl,
              width: this.getQrCodeSize(),
              height: this.getQrCodeSize(),
              alignment: 'left', // the QR code at left in its column
            },
            {
              text: 'Scan for contact info',
              fontSize: 8,
              alignment: 'left',
              margin: [12, 5, 0, 0], // [left, top, right, bottom]
            },
          ],
          width: '50%',
          alignment: 'left',
        });
      }
    }

    // Add signature if enabled
    if (this.includeSignatureLine) {
      const signatureContent: any = {
        stack: [],
        width: '50%',
        alignment: 'right',
      };

      // Calculate vertical margin to align with QR code
      const verticalMargin = this.includeQrCode ? this.getQrCodeSize() / 3 : 0;
      // Digital signature with image
      if (this.useDigitalSignature && this.signatureImageUrl) {
        try {
          const signatureDataUrl = await this.getImageDataUrl(this.signatureImageUrl);
          signatureContent.stack.push(
            {
              image: signatureDataUrl,
              width: 100,
              alignment: 'right',
              // Add top margin to align vertically with QR code
              margin: [0, verticalMargin, 0, 0],
            },
            {
              text: this.resumeService.getProfile()?.fullName || 'Candidate',
              fontSize: 8,
              alignment: 'right',
              margin: [0, 5, 0, 0],
            },
          );
        } catch (e) {
          console.error('Error loading signature image:', e);
          // Fallback to signature line with margin
          this.addSignatureLine(signatureContent.stack, verticalMargin);
        }
      }
      // Normal signature line
      else {
        this.addSignatureLine(signatureContent.stack, verticalMargin);
      }

      footerContent.push(signatureContent);

      // If no QR code, add an empty column first to push signature to right
      if (!this.includeQrCode || !this.qrData.qrDataString) {
        // Insert empty column at the beginning
        footerContent.unshift({
          text: '',
          width: '50%',
        });
      }
    }

    // If we have content, add it as a row to the document
    if (footerContent.length > 0) {
      docDefinition.content.push(
        { text: '', margin: [0, 20, 0, 10] }, // Add some spacing before footer
        {
          columns: footerContent,
        },
      );
    }
  }

  private addSignatureLine(stack: any[], topMargin: number = 0): void {
    stack.push(
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 120,
            y2: 0,
            lineWidth: 1,
          },
        ],
        alignment: 'right',
        // Apply top margin to align with QR code
        margin: [0, topMargin, 0, 0],
      },
      {
        text: `Signature (${this.resumeService.getProfile()?.fullName || 'Candidate'})`,
        fontSize: 8,
        alignment: 'right',
        margin: [0, 5, 0, 0],
      },
    );
  }

  // Utility to get image data URL
  private getImageDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // If it's already a data URL, return it
      if (url.startsWith('data:')) {
        resolve(url);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Enable CORS

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  clearAllResumeData(): void {
    if (
      confirm('WARNING: This will permanently delete ALL your resume data. This action cannot be undone. Are you sure?')
    ) {
      // Double-confirm due to the destructive nature
      if (confirm('Please confirm one more time. All your data will be deleted.')) {
        this.resumeService.cleanLocalStorage();

        // Reset component state
        this.includeQrCode = false;
        this.includeSignatureLine = false;
        this.useDigitalSignature = false;
        this.signatureImageUrl = '';

        // Notify user
        alert('All resume data has been cleared successfully.');

        // Force refresh preview if showing
        if (this.showPreview) {
          this.showPreview = false;
          setTimeout(() => {
            this.showPreview = true;
          }, 100);
        }
      }
    }
  }
}
