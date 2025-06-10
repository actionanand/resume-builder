import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { Certificate } from '../../models';

@Component({
  selector: 'app-certificates',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './certificates.html',
  styleUrls: ['./certificates.scss'],
})
export class Certificates implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  certificateForm!: FormGroup;
  formSubmitted = false; // To track if form was submitted for validation

  private resumeService = inject(ResumeService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initForm();
    this.loadCertificates();
  }

  private initForm(): void {
    this.certificateForm = this.fb.group({
      certificates: this.fb.array([]),
    });
  }

  private loadCertificates(): void {
    const savedCertificates = this.resumeService.getCertificates();

    if (savedCertificates && savedCertificates.length > 0) {
      savedCertificates.forEach(cert => {
        this.addCertificate(cert);
      });
    } else {
      // Add one empty certificate by default
      this.addCertificate();
    }
  }

  get certificatesArray(): FormArray {
    return this.certificateForm.get('certificates') as FormArray;
  }

  addCertificate(certificate?: Certificate): void {
    this.certificatesArray.push(
      this.fb.group({
        name: [certificate?.name || '', Validators.required],
        issuer: [certificate?.issuer || '', Validators.required],
        date: [certificate?.date || ''],
        expiration: [certificate?.expiration || ''],
        credentialId: [certificate?.credentialId || ''],
        url: [certificate?.url || ''],
        description: [certificate?.description || ''],
      }),
    );
  }

  removeCertificate(index: number): void {
    this.certificatesArray.removeAt(index);
  }

  // Only save if there's valid data - empty or incomplete forms won't get saved
  saveCertificates(): void {
    this.formSubmitted = true;

    // Filter out empty certificates before saving
    if (this.certificateForm.valid) {
      const certificates = this.certificateForm.value.certificates.filter(
        (cert: Certificate) => cert.name && cert.issuer,
      );

      if (certificates.length > 0) {
        this.resumeService.saveCertificates(certificates);
      }
    }
  }

  // Reset a specific certificate to blank state
  resetCertificate(index: number): void {
    // Get the form group at the specified index
    const certificateGroup = this.certificatesArray.at(index) as FormGroup;

    if (confirm('Are you sure you want to clear this certificate? This action cannot be undone.')) {
      // Reset each control to empty string
      const currentCertificates = this.resumeService.getCertificates() || [];

      certificateGroup.patchValue({
        name: '',
        issuer: '',
        date: '',
        expiration: '',
        credentialId: '',
        url: '',
        description: '',
      });

      // Mark controls as untouched and pristine
      Object.keys(certificateGroup.controls).forEach(key => {
        const control = certificateGroup.get(key);
        control?.markAsUntouched();
        control?.markAsPristine();
      });

      // If the certificate exists in storage, remove it
      if (currentCertificates[index]) {
        // Either replace with empty certificate or remove it completely
        const updatedCertificates = [...currentCertificates];
        updatedCertificates.splice(index, 1, { name: '', issuer: '', date: '' });
        this.resumeService.saveCertificates(updatedCertificates);
      }
    }
  }

  // Clear entire form
  clearAllCertificates(): void {
    // Add confirmation dialog to prevent accidental deletion
    if (confirm('Are you sure you want to clear all certificates? This action cannot be undone.')) {
      // Remove all certificates from the form array
      while (this.certificatesArray.length) {
        this.certificatesArray.removeAt(0);
      }

      // Add one empty certificate form
      this.addCertificate();

      // Reset form submission state
      this.formSubmitted = false;

      // IMPORTANT: Clear the certificates data in localStorage
      this.resumeService.saveCertificates([]);
    }
  }

  goToPreviousSection(): void {
    this.saveCertificates();
    this.navigate.emit('education');
  }

  goToNextSection(): void {
    this.saveCertificates();
    this.navigate.emit('languages');
  }
}
