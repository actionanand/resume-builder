/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, ElementRef, ViewChild, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeComponent } from 'angularx-qrcode';

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
    this.showMessage('Generating PDF...');

    setTimeout(() => {
      const element = this.resumePreview.nativeElement;

      html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      })
        .then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('resume.pdf');

          this.isGeneratingPDF = false;
          this.showMessage('PDF downloaded successfully');
        })
        .catch(err => {
          console.error('Error generating PDF', err);
          this.isGeneratingPDF = false;
          this.showMessage('Error generating PDF. Please try again.');
        });
    }, 500); // 500ms delay to ensure QR code is rendered
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
}
