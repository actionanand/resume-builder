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

  // Organize blood groups more logically
  bloodGroupOptions = [
    // Common groups first
    'A+',
    'B+',
    'AB+',
    'O+',
    'A-',
    'B-',
    'AB-',
    'O-',
    // Less common groups
    'A1+',
    'A1-',
    'A1B+',
    'A1B-',
    // Special cases
    'Bombay Phenotype (hh)',
    'RH-null (Golden Blood)',
    'Other Rare Group',
    'Unknown',
    'Prefer not to say',
  ];

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
      parentName: [''], // Combined field for father's or husband's name
      mothersName: [''],
      hasSiblings: [false],
      siblingCount: [0],
      religion: [''],
      passportNumber: [''],
      drivingLicense: [''],
      bloodGroup: [''],
      hobbies: [''], // Will be split by comma
    });
  }

  private loadDetails(): void {
    const savedDetails = this.resumeService.getPersonalDetails() as PersonalDetails & { husbandName?: string };

    if (savedDetails) {
      // Handle conditionally named fields
      let parentName = '';
      if (savedDetails.fathersName) {
        parentName = savedDetails.fathersName;
      } else if (savedDetails.husbandName) {
        parentName = savedDetails.husbandName;
      }

      // For hobbies, join the array back to a string for the form
      const formValue = {
        ...savedDetails,
        parentName: parentName,
        hobbies: savedDetails.hobbies ? savedDetails.hobbies.join(', ') : '',
      };

      this.detailsForm.patchValue(formValue);
      this.updateSiblingsField();
    }
  }

  shouldShowHusbandName(): boolean {
    const gender = this.detailsForm.get('gender')?.value;
    const maritalStatus = this.detailsForm.get('maritalStatus')?.value;
    return gender === 'Female' && maritalStatus === 'Married';
  }

  updateFormFields(): void {
    // This will update the form fields display based on conditions
    // No actual code needed here, Angular's change detection will handle it
  }

  updateSiblingsField(): void {
    const hasSiblings = this.detailsForm.get('hasSiblings')?.value;

    if (!hasSiblings) {
      this.detailsForm.get('siblingCount')?.setValue(0);
    }
  }

  saveDetails(): void {
    // Since all fields are optional, we just save whatever data is present
    const formValue = this.detailsForm.value;

    // Only process fields that have meaningful values
    const personalDetails: any = Object.keys(formValue).reduce((result: any, key) => {
      // Skip empty strings, null values, default boolean false, and default number 0
      if (
        formValue[key] !== '' &&
        formValue[key] !== null &&
        !(key === 'hasSiblings' && formValue[key] === false) &&
        !(key === 'siblingCount' && formValue[key] === 0)
      ) {
        if (key === 'hobbies') {
          // Convert comma-separated hobbies string to array
          const hobbies = formValue[key]
            .split(',')
            .map((hobby: string) => hobby.trim())
            .filter((hobby: string) => hobby);

          // Only add if there are actual hobbies
          if (hobbies.length > 0) {
            result[key] = hobbies;
          }
        } else {
          result[key] = formValue[key];
        }
      }
      return result;
    }, {});

    // Map parentName to the correct field name based on gender and marital status
    if (personalDetails.parentName) {
      if (this.shouldShowHusbandName()) {
        personalDetails.husbandName = personalDetails.parentName;
      } else {
        personalDetails.fathersName = personalDetails.parentName;
      }
      delete personalDetails.parentName;
    }

    // Clear stored details if nothing was entered
    if (Object.keys(personalDetails).length === 0) {
      this.resumeService.savePersonalDetails({});
      return;
    }

    // Save the details
    this.resumeService.savePersonalDetails(personalDetails);
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
