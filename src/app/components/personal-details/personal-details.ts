/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormArray } from '@angular/forms';
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
  bloodGroupCategories = [
    {
      name: 'Common Blood Groups',
      color: '#95a5a6',
      options: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'],
    },
    {
      name: 'Less Common Blood Groups',
      color: '#95a5a6',
      options: ['A1+', 'A1-', 'A1B+', 'A1B-'],
    },
    {
      name: 'Rare Blood Groups',
      color: '#95a5a6',
      options: ['Bombay Phenotype (hh)', 'RH-null (Golden Blood)', 'Other Rare Group'],
    },
    {
      name: 'Other',
      color: '#95a5a6', // Gray
      options: ['Unknown', 'Prefer not to say'],
    },
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
      otherInfo: this.fb.array([]),
    });
  }

  private loadDetails(): void {
    const savedDetails = this.resumeService.getPersonalDetails() as PersonalDetails & {
      husbandName?: string;
      otherInfo?: Array<{ key: string; value: string }>;
    };

    if (savedDetails) {
      // Handle conditionally named fields as before...
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

      // Remove the otherInfo field from the form value to prevent conflicts with FormArray
      delete formValue.otherInfo;

      // Update the form with the basic fields
      this.detailsForm.patchValue(formValue);

      // Add other info fields if they exist
      if (savedDetails.otherInfo && savedDetails.otherInfo.length > 0) {
        // Clear any existing entries
        while (this.otherInfoArray.length) {
          this.otherInfoArray.removeAt(0);
        }

        // Add saved info fields
        savedDetails.otherInfo.forEach(info => {
          const infoGroup = this.createInfoField();
          infoGroup.patchValue(info);
          this.otherInfoArray.push(infoGroup);
        });
      }

      this.updateSiblingsField();
    }
  }

  // Add getter for easy access to the FormArray
  get otherInfoArray(): FormArray {
    return this.detailsForm.get('otherInfo') as FormArray;
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

  // Add method to create a new info field group
  createInfoField(): FormGroup {
    return this.fb.group({
      key: [''],
      value: [''],
    });
  }

  // Add method to add a new info field
  addInfoField(): void {
    this.otherInfoArray.push(this.createInfoField());
  }

  // Add method to remove an info field
  removeInfoField(index: number): void {
    this.otherInfoArray.removeAt(index);
  }

  saveDetails(): void {
    const formValue = this.detailsForm.value;

    // Process the other info array separately
    const otherInfoArray = formValue.otherInfo || [];
    delete formValue.otherInfo;

    // Use the existing logic for other fields
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

    // Process parent name field as before
    if (personalDetails.parentName) {
      if (this.shouldShowHusbandName()) {
        personalDetails.husbandName = personalDetails.parentName;
      } else {
        personalDetails.fathersName = personalDetails.parentName;
      }
      delete personalDetails.parentName;
    }

    // Add the filtered other info array
    const validOtherInfo = otherInfoArray
      .filter((info: any) => info.key && info.value)
      .map((info: any) => ({
        key: info.key.trim(),
        value: info.value.trim(),
      }));

    if (validOtherInfo.length > 0) {
      personalDetails.otherInfo = validOtherInfo;
    }

    // Clear stored details if nothing was entered
    if (Object.keys(personalDetails).length === 0) {
      this.resumeService.savePersonalDetails({});
      return;
    }

    // Save the details
    this.resumeService.savePersonalDetails(personalDetails);
  }

  clearAllDetails(): void {
    if (confirm('Are you sure you want to clear all personal details? This action cannot be undone.')) {
      // Reset the form to empty values
      this.detailsForm.reset({
        dateOfBirth: '',
        placeOfBirth: '',
        nationality: '',
        maritalStatus: '',
        gender: '',
        parentName: '',
        mothersName: '',
        hasSiblings: false,
        siblingCount: 0,
        religion: '',
        passportNumber: '',
        drivingLicense: '',
        bloodGroup: '',
        hobbies: '',
      });

      // Clear the otherInfo array
      while (this.otherInfoArray.length) {
        this.otherInfoArray.removeAt(0);
      }

      // Clear data in storage
      this.resumeService.savePersonalDetails({});
    }
  }

  goToPreviousSection(): void {
    this.saveDetails();
    this.navigate.emit('languages');
  }

  goToNextSection(): void {
    this.saveDetails();
    this.navigate.emit('declaration');
  }
}
