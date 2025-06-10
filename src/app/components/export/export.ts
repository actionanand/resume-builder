/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, ElementRef, ViewChild, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { QRCodeComponent } from 'angularx-qrcode';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
// import pdfMake from 'pdfmake/build/pdfmake';
// import pdfFonts from 'pdfmake/build/vfs_fonts';

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

  protected resumeService = inject(ResumeService);

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
    link.download = finalFilename;
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
    const docDefinition: any = {
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

    // Add personal details section
    this.addPersonalDetailsSection(docDefinition, colors);

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
  private addPersonalDetailsSection(docDefinition: any, colors: any): void {
    const personalDetails = this.resumeService.getPersonalDetails();
    if (!personalDetails || Object.keys(personalDetails).length === 0) return;

    docDefinition.content.push({ text: 'Personal Details', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors);

    const detailsTable = {
      table: {
        widths: ['30%', '5%', '65%'], // Three columns: key, colon, value
        body: [] as any[],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 10],
    };

    // Add each detail to the table
    if (personalDetails.dateOfBirth) {
      detailsTable.table.body.push([
        {
          text: 'Date of Birth',
          style: 'smallText',
          bold: true,
          color: colors.secondaryColor, // Key color
          alignment: 'left', // Right align all keys
        },
        {
          text: ':',
          style: 'smallText',
          bold: true,
          color: colors.secondaryColor,
        },
        {
          text: personalDetails.dateOfBirth,
          style: 'smallText',
          color: colors.textColor, // Value color
        },
      ]);
    }

    if (personalDetails.placeOfBirth) {
      detailsTable.table.body.push([
        {
          text: 'Place of Birth',
          style: 'smallText',
          bold: true,
          color: colors.secondaryColor,
          alignment: 'left',
        },
        {
          text: ':',
          style: 'smallText',
          bold: true,
          color: colors.secondaryColor,
        },
        {
          text: personalDetails.placeOfBirth,
          style: 'smallText',
          color: colors.textColor,
        },
      ]);
    }

    if (personalDetails.nationality) {
      detailsTable.table.body.push([
        { text: 'Nationality', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.nationality, style: 'smallText', color: colors.textColor },
      ]);
    }

    if (personalDetails.gender) {
      detailsTable.table.body.push([
        { text: 'Gender', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.gender, style: 'smallText', color: colors.textColor },
      ]);
    }

    if (personalDetails.maritalStatus) {
      detailsTable.table.body.push([
        { text: 'Marital Status', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.maritalStatus, style: 'smallText', color: colors.textColor },
      ]);
    }

    // Check if person is female and married
    const isMarriedFemale = personalDetails.gender === 'Female' && personalDetails.maritalStatus === 'Married';

    // Show Husband's name instead of Father's name for married females
    if (isMarriedFemale && personalDetails.husbandName) {
      detailsTable.table.body.push([
        { text: "Husband's Name", style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.husbandName, style: 'smallText', color: colors.textColor },
      ]);
    }
    // Otherwise show Father's name if available
    else if (personalDetails.fathersName) {
      detailsTable.table.body.push([
        { text: "Father's Name", style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.fathersName, style: 'smallText', color: colors.textColor },
      ]);
    }

    // Only show Mother's name if not a married female
    if (!isMarriedFemale && personalDetails.mothersName) {
      detailsTable.table.body.push([
        { text: "Mother's Name", style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.mothersName, style: 'smallText', color: colors.textColor },
      ]);
    }

    // Add sibling information if applicable
    if (personalDetails.hasSiblings === true && (personalDetails.siblingCount ?? 0) > 0) {
      detailsTable.table.body.push([
        {
          text: 'Number of Siblings',
          style: 'smallText',
          bold: true,
          color: colors.secondaryColor,
          alignment: 'left',
        },
        {
          text: ':',
          style: 'smallText',
          bold: true,
          color: colors.secondaryColor,
        },
        {
          text: (personalDetails.siblingCount ?? 0).toString(),
          style: 'smallText',
          color: colors.textColor,
        },
      ]);
    }

    if (personalDetails.religion) {
      detailsTable.table.body.push([
        { text: 'Religion', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.religion, style: 'smallText', color: colors.textColor },
      ]);
    }

    if (personalDetails.passportNumber) {
      detailsTable.table.body.push([
        { text: 'Passport Number', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.passportNumber, style: 'smallText', color: colors.textColor },
      ]);
    }

    if (personalDetails.drivingLicense) {
      detailsTable.table.body.push([
        { text: 'Driving License', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.drivingLicense, style: 'smallText', color: colors.textColor },
      ]);
    }

    if (personalDetails.bloodGroup) {
      detailsTable.table.body.push([
        { text: 'Blood Group', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.bloodGroup, style: 'smallText', color: colors.textColor },
      ]);
    }

    if (personalDetails.hobbies && personalDetails.hobbies.length) {
      detailsTable.table.body.push([
        { text: 'Hobbies', style: 'smallText', bold: true, color: colors.secondaryColor, alignment: 'left' },
        { text: ':', style: 'smallText', bold: true, color: colors.secondaryColor },
        { text: personalDetails.hobbies.join(', '), style: 'smallText', color: colors.textColor },
      ]);
    }

    if (personalDetails.otherInfo && personalDetails.otherInfo.length > 0) {
      personalDetails.otherInfo.forEach((info: any) => {
        detailsTable.table.body.push([
          {
            text: info.key,
            style: 'smallText',
            bold: true,
            color: colors.secondaryColor,
            alignment: 'left',
          },
          {
            text: ':',
            style: 'smallText',
            bold: true,
            color: colors.secondaryColor,
          },
          {
            text: info.value,
            style: 'smallText',
            color: colors.textColor,
          },
        ]);
      });
    }

    // Add the table to the document
    docDefinition.content.push(detailsTable);
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
  private getThemeColors(): any {
    switch (this.selectedTheme) {
      case 'modern':
        return {
          primaryColor: '#3498db', // Blue for headings and lines
          secondaryColor: '#2c3e50', // Dark blue for section titles
          accentColor: '#2980b9', // Medium blue for links
          textColor: '#333333', // Near-black for normal text
          subtitleColor: '#7f8c8d', // Gray for dates and small text
          lineColor: '#3498db', // Make sure section lines match the primary color
        };
      case 'classic':
        return {
          primaryColor: '#000000', // Pure black for headings
          secondaryColor: '#333333', // Dark gray for section titles
          accentColor: '#666666', // Medium gray for links
          textColor: '#000000', // Black for normal text
          subtitleColor: '#555555', // Gray for dates and small text
          lineColor: '#000000', // Black for section lines
        };
      case 'minimal':
        return {
          primaryColor: '#333333', // Dark gray for headings
          secondaryColor: '#555555', // Medium gray for section titles
          accentColor: '#777777', // Light gray for links
          textColor: '#333333', // Dark gray for normal text
          subtitleColor: '#7f8c8d', // Lighter gray for dates and small text
          lineColor: '#333333', // Match heading color for lines
        };
      case 'professional':
        return {
          primaryColor: '#2c3e50', // Dark blue for headings
          secondaryColor: '#34495e', // Medium blue for section titles
          accentColor: '#2980b9', // Lighter blue for links
          textColor: '#333333', // Near-black for normal text
          subtitleColor: '#7f8c8d', // Gray for dates and small text
          lineColor: '#2c3e50', // Match heading color for lines
        };
      default:
        return {
          primaryColor: '#000000',
          secondaryColor: '#333333',
          accentColor: '#666666',
          textColor: '#000000',
          subtitleColor: '#555555',
          lineColor: '#000000',
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
  private addSkillsSection(docDefinition: any, colors: any): void {
    const skills = this.resumeService.getSkills();
    if (!skills?.length) return;

    docDefinition.content.push({ text: 'Skills', style: 'subheader' });
    this.addSectionTitleLine(docDefinition, colors); // Add line below title

    skills.forEach((skillGroup: any) => {
      docDefinition.content.push(
        { text: skillGroup.category, style: 'sectionTitle' },
        { text: skillGroup.skills.join(', '), style: 'normalText', margin: [0, 0, 0, 8] },
      );
    });
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
