/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { QRCodeComponent } from 'angularx-qrcode';
import { Subscription } from 'rxjs';

import { ResumeService } from '../../services/resume';

interface CustomField {
  key: string;
  value: string;
}

@Component({
  selector: 'app-qr-code',
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss',
})
export class QrCode implements OnInit, OnDestroy {
  // QR code data
  qrDataString = '';
  darkColor = '#000000';

  @Output() navigate = new EventEmitter<string>();

  // Custom fields
  customFields: CustomField[] = [];

  // Profile data
  profileData: any;
  private subscription?: Subscription;

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    // Get initial profile data
    this.profileData = this.resumeService.getProfile();

    // Subscribe to profile changes
    this.subscription = this.resumeService.resumeData$.subscribe(data => {
      if (data.profile) {
        this.profileData = data.profile;
        this.updateQrCode();
      }
    });

    // Load any previously saved custom fields
    const savedQrData = localStorage.getItem('resumeQrCustomFields');
    if (savedQrData) {
      try {
        this.customFields = JSON.parse(savedQrData);
      } catch (e) {
        console.error('Error parsing saved QR data', e);
        this.customFields = [];
      }
    }

    // Generate initial QR code
    this.updateQrCode();
  }

  goToPreviousSection(): void {
    this.navigate.emit('education');
  }

  finishAndExport(): void {
    // You might want to save QR code state here
    this.navigate.emit('export');
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addCustomField(): void {
    this.customFields.push({ key: '', value: '' });
  }

  removeCustomField(index: number): void {
    this.customFields.splice(index, 1);
    this.updateQrCode();
    this.saveCustomFields();
  }

  updateQrCode(): void {
    // Start with basic contact info in vCard format
    let vCardData = 'BEGIN:VCARD\nVERSION:3.0\n';

    // Add profile information if available
    if (this.profileData) {
      if (this.profileData.fullName) {
        vCardData += `FN:${this.profileData.fullName}\n`;
        vCardData += `N:${this.profileData.fullName};;;\n`;
      }

      if (this.profileData.phone) {
        vCardData += `TEL;TYPE=CELL:${this.profileData.phone}\n`;
      }

      if (this.profileData.email) {
        vCardData += `EMAIL:${this.profileData.email}\n`;
      }

      if (this.profileData.portfolio) {
        vCardData += `URL:${this.profileData.portfolio}\n`;
      }
    }

    // Add custom fields as notes
    if (this.customFields.length > 0) {
      let noteContent = '';

      this.customFields.forEach(field => {
        if (field.key && field.value) {
          noteContent += `${field.key}: ${field.value}\n`;
        }
      });

      if (noteContent) {
        vCardData += `NOTE:${noteContent}`;
      }
    }

    // End vCard
    vCardData += 'END:VCARD';

    this.qrDataString = vCardData;
    this.saveCustomFields();

    // Share the QR code data with other components through the service
    this.resumeService.updateQrCodeData({
      qrDataString: this.qrDataString,
      darkColor: this.darkColor,
      customFields: this.customFields,
    });
  }

  saveCustomFields(): void {
    // Save only non-empty custom fields
    const fieldsToSave = this.customFields.filter(field => field.key || field.value);
    localStorage.setItem('resumeQrCustomFields', JSON.stringify(fieldsToSave));
  }

  downloadQrCode(): void {
    const canvas = document.querySelector('.qr-container canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'resume-qr-code.png';
      link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      link.click();
    }
  }
}
