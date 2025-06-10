/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';

import { ResumeService } from '../../services/resume';
import { PersonalDetails } from '../../models';

@Component({
  selector: 'app-personal-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './personal-details.html',
  styleUrls: ['./personal-details.scss'],
})
export class PersonalDetailsComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  detailsForm!: FormGroup;

  maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];

  genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  private resumeService = inject(ResumeService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initForm();
    this.loadDetails();
  }

  private initForm(): void {
    this.detailsForm = this.fb.group({
      dateOfBirth: [''],
      placeOfBirth: [''],
      nationality: [''],
      maritalStatus: [''],
      gender: [''],
      fathersName: [''],
      mothersName: [''],
      hobbies: [''], // Will be split by comma
      religion: [''],
      passportNumber: [''],
      drivingLicense: [''],
      bloodGroup: [''],
    });
  }

  private loadDetails(): void {
    const savedDetails = this.resumeService.getPersonalDetails();

    if (savedDetails) {
      // For hobbies, join the array back to a string for the form
      const formValue = {
        ...savedDetails,
        hobbies: savedDetails.hobbies ? savedDetails.hobbies.join(', ') : '',
      };
      this.detailsForm.patchValue(formValue);
    }
  }

  saveDetails(): void {
    // Since all fields are optional, we just save whatever data is present
    const formValue = this.detailsForm.value;

    // Only process fields that have values
    const personalDetails: PersonalDetails = Object.keys(formValue).reduce((result: any, key) => {
      if (formValue[key]) {
        if (key === 'hobbies') {
          // Convert comma-separated hobbies string to array
          result[key] = formValue[key]
            .split(',')
            .map((hobby: string) => hobby.trim())
            .filter((hobby: string) => hobby);
        } else {
          result[key] = formValue[key];
        }
      }
      return result;
    }, {});

    // Only save if there's at least one field filled out
    if (Object.keys(personalDetails).length > 0) {
      this.resumeService.savePersonalDetails(personalDetails);
    }
  }

  goToPreviousSection(): void {
    this.saveDetails();
    this.navigate.emit('languages');
  }

  goToNextSection(): void {
    this.saveDetails();
    this.navigate.emit('qr-code');
  }
}
