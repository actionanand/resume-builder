import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { QRCodeComponent } from 'angularx-qrcode';

import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-qr-code',
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss'
})
export class QrCode implements OnInit {
  qrName = '';
  qrPhone = '';
  qrEmail = '';
  qrPortfolio = '';
  darkColor = '#000000';
  qrDataString = '';
  
  resumeService = inject(ResumeService);
  
  ngOnInit(): void {
    const profile = this.resumeService.getProfile();
    if (profile) {
      this.qrName = profile.fullName || '';
      this.qrPhone = profile.phone || '';
      this.qrEmail = profile.email || '';
      this.qrPortfolio = profile.portfolio || '';
      this.updateQrCode();
    }
  }
  
  updateQrCode(): void {
    // Create a vCard format string
    const vCardData = [];
    vCardData.push('BEGIN:VCARD');
    vCardData.push('VERSION:3.0');
    
    if (this.qrName) {
      vCardData.push(`FN:${this.qrName}`);
      vCardData.push(`N:${this.qrName};;;`);
    }
    
    if (this.qrPhone) {
      vCardData.push(`TEL;TYPE=CELL:${this.qrPhone}`);
    }
    
    if (this.qrEmail) {
      vCardData.push(`EMAIL:${this.qrEmail}`);
    }
    
    if (this.qrPortfolio) {
      vCardData.push(`URL:${this.qrPortfolio}`);
    }
    
    vCardData.push('END:VCARD');
    
    this.qrDataString = vCardData.join('\n');
  }
  
  downloadQrCode(): void {
    const canvas = document.querySelector('.qr-container canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'resume-contact-qr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }
}
