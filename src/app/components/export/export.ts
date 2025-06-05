/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, ElementRef, ViewChild, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
import { QRCodeComponent } from 'angularx-qrcode';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './export.html',
  styleUrls: ['./export.scss'],
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

  protected resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.generateMarkdown();

    pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
    this.markdownContent = this.resumeService.exportAsMarkdown();
  }

  copyMarkdown(): void {
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
    this.showMessage('Creating ATS-friendly PDF...');

    // Convert resume to pdfmake document definition
    this.createPdfDefinition()
      .then(docDefinition => {
        // Create and download the PDF
        pdfMake.createPdf(docDefinition).download('resume.pdf');

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
    // Create a blob with HTML content
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resumeData = this.resumeService.getResumeData();
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Resume</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #333; }
          h2 { color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        </style>
      </head>
      <body>`;

    // Get the HTML content from the preview
    const postHtml = '</body></html>';
    const previewHtml = this.resumePreview.nativeElement.innerHTML;

    const html = preHtml + previewHtml + postHtml;
    const blob = new Blob([html], { type: 'application/msword' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.doc';
    link.click();
    URL.revokeObjectURL(url);

    this.showMessage('Word document downloaded');
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

  // This method creates the pdfmake document definition
  private async createPdfDefinition(): Promise<any> {
    // Get color scheme based on theme
    const colors = this.getThemeColors();

    // Set base font size based on selected size
    const baseFontSize = this.getFontSize();

    // Create document definition
    const docDefinition: any = {
      content: [],
      defaultStyle: {
        font: 'Roboto',
        fontSize: baseFontSize,
        lineHeight: 1.3,
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
          margin: [0, 10, 0, 5],
        },
        sectionTitle: {
          fontSize: baseFontSize * 1.2,
          bold: true,
          margin: [0, 8, 0, 4],
        },
        normalText: {
          fontSize: baseFontSize,
          margin: [0, 2, 0, 2],
        },
        smallText: {
          fontSize: baseFontSize * 0.9,
          margin: [0, 1, 0, 1],
        },
        listItem: {
          margin: [0, 2, 0, 2],
        },
      },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
    };

    // Add profile section
    await this.addProfileSection(docDefinition, colors);

    // Add about section
    this.addAboutSection(docDefinition);

    // Add skills section
    this.addSkillsSection(docDefinition);

    // Add experience section
    this.addExperienceSection(docDefinition);

    // Add projects section
    this.addProjectsSection(docDefinition, colors);

    // Add education section
    this.addEducationSection(docDefinition);

    // Add footer with QR code and signature
    await this.addFooterSection(docDefinition);

    return docDefinition;
  }

  // Helper method for theme colors
  private getThemeColors(): any {
    switch (this.selectedTheme) {
      case 'modern':
        return {
          primaryColor: '#3498db',
          secondaryColor: '#2c3e50',
          accentColor: '#e74c3c',
        };
      case 'classic':
        return {
          primaryColor: '#000000',
          secondaryColor: '#333333',
          accentColor: '#666666',
        };
      case 'minimal':
        return {
          primaryColor: '#333333',
          secondaryColor: '#555555',
          accentColor: '#777777',
        };
      case 'professional':
        return {
          primaryColor: '#2c3e50',
          secondaryColor: '#34495e',
          accentColor: '#2980b9',
        };
      default:
        return {
          primaryColor: '#000000',
          secondaryColor: '#333333',
          accentColor: '#666666',
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
              { text: profile.fullName, style: 'header' },
              { text: profile.title, style: 'normalText', margin: [0, 0, 0, 10] },
              this.createContactInfo(profile),
              this.createProfileLinks(profile),
            ],
          },
        ],
        margin: [0, 0, 0, 15],
      });
    } else {
      // No photo, just add the text elements
      profileSection.push(
        { text: profile.fullName, style: 'header' },
        { text: profile.title, style: 'normalText', margin: [0, 0, 0, 10] },
        this.createContactInfo(profile),
        this.createProfileLinks(profile),
      );
    }

    docDefinition.content.push(...profileSection);
  }

  // Create contact info row
  private createContactInfo(profile: any): any {
    const contactItems = [];

    if (profile.email) {
      contactItems.push({ text: profile.email, style: 'smallText' });
    }

    if (profile.phone) {
      contactItems.push({ text: profile.phone, style: 'smallText' });
    }

    if (profile.location) {
      contactItems.push({ text: profile.location, style: 'smallText' });
    }

    if (contactItems.length === 0) return null;

    // Add separator between items
    const separatedItems = [];
    for (let i = 0; i < contactItems.length; i++) {
      separatedItems.push(contactItems[i]);
      if (i < contactItems.length - 1) {
        separatedItems.push({ text: ' • ', style: 'smallText' });
      }
    }

    return {
      stack: [
        {
          text: separatedItems,
        },
      ],
      margin: [0, 0, 0, 5],
    };
  }

  // Create profile links row
  private createProfileLinks(profile: any): any {
    const linkItems = [];

    if (profile.github) {
      const text = this.showHyperlinkUrls ? profile.github : 'GitHub';
      linkItems.push({
        text: text,
        link: profile.github,
        style: 'smallText',
        color: '#0000EE',
      });
    }

    if (profile.linkedin) {
      const text = this.showHyperlinkUrls ? profile.linkedin : 'LinkedIn';
      linkItems.push({
        text: text,
        link: profile.linkedin,
        style: 'smallText',
        color: '#0000EE',
      });
    }

    if (profile.portfolio) {
      const text = this.showHyperlinkUrls ? profile.portfolio : 'Portfolio';
      linkItems.push({
        text: text,
        link: profile.portfolio,
        style: 'smallText',
        color: '#0000EE',
      });
    }

    if (linkItems.length === 0) return null;

    // Add separator between items
    const separatedItems = [];
    for (let i = 0; i < linkItems.length; i++) {
      separatedItems.push(linkItems[i]);
      if (i < linkItems.length - 1) {
        separatedItems.push({ text: ' • ', style: 'smallText' });
      }
    }

    return {
      stack: [
        {
          text: separatedItems,
        },
      ],
      margin: [0, 0, 0, 5],
    };
  }

  // About section
  private addAboutSection(docDefinition: any): void {
    const about = this.resumeService.getAbout();
    if (!about) return;

    docDefinition.content.push(
      { text: 'About', style: 'subheader' },
      { text: about, style: 'normalText', margin: [0, 0, 0, 10] },
    );
  }

  // Skills section
  private addSkillsSection(docDefinition: any): void {
    const skills = this.resumeService.getSkills();
    if (!skills?.length) return;

    docDefinition.content.push({ text: 'Skills', style: 'subheader' });

    skills.forEach((skillGroup: any) => {
      docDefinition.content.push(
        { text: skillGroup.category, style: 'sectionTitle' },
        { text: skillGroup.skills.join(', '), style: 'normalText', margin: [0, 0, 0, 8] },
      );
    });
  }

  // Experience section
  private addExperienceSection(docDefinition: any): void {
    const experiences = this.resumeService.getExperiences();
    if (!experiences?.length) return;

    docDefinition.content.push({ text: 'Experience', style: 'subheader' });

    experiences.forEach((exp: any) => {
      // Create experience header with position and date
      docDefinition.content.push({
        columns: [
          {
            text: exp.position,
            style: 'sectionTitle',
            width: '*',
          },
          {
            text: `${exp.startDate} - ${exp.endDate || 'Present'}`,
            style: 'smallText',
            width: 'auto',
            alignment: 'right',
          },
        ],
        margin: [0, 5, 0, 0],
      });

      // Add company and location
      const companyInfo = [exp.company];
      if (exp.location) companyInfo.push(exp.location);

      docDefinition.content.push({
        text: companyInfo.join(' • '),
        style: 'smallText',
        italics: true,
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
          margin: [0, 0, 0, 10],
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
          width: 'auto',
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
          text: [{ text: 'Technologies: ', bold: true }, project.technologies],
          style: 'smallText',
          margin: [0, 0, 0, 10],
        });
      } else {
        // Add spacing after project
        docDefinition.content.push({ text: '', margin: [0, 0, 0, 10] });
      }
    });
  }

  // Education section
  private addEducationSection(docDefinition: any): void {
    const educations = this.resumeService.getEducation();
    if (!educations?.length) return;

    docDefinition.content.push({ text: 'Education', style: 'subheader' });

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
            style: 'smallText',
            width: 'auto',
            alignment: 'right',
          },
        ],
        margin: [0, 5, 0, 0],
      });

      // Add institution and location
      const institutionInfo = [edu.institution];
      if (edu.location) institutionInfo.push(edu.location);

      docDefinition.content.push({
        text: institutionInfo.join(' • '),
        style: 'smallText',
        italics: true,
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
            },
            {
              text: 'Scan for contact info',
              fontSize: 8,
              alignment: 'center',
              margin: [0, 5, 0, 0],
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

      // Digital signature with image
      if (this.useDigitalSignature && this.signatureImageUrl) {
        try {
          const signatureDataUrl = await this.getImageDataUrl(this.signatureImageUrl);
          signatureContent.stack.push(
            {
              image: signatureDataUrl,
              width: 100,
              alignment: 'right',
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
          // Fallback to signature line
          this.addSignatureLine(signatureContent.stack);
        }
      }
      // Normal signature line
      else {
        this.addSignatureLine(signatureContent.stack);
      }

      footerContent.push(signatureContent);
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

  // Helper to add signature line
  private addSignatureLine(stack: any[]): void {
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
}
