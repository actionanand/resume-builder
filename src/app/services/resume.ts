/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { Certificate, DeclarationDef, GeneralSection, Language, PersonalDetails, ProfileInfo, Trait } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private readonly DEFAULT_DECLARATION: DeclarationDef = {
    enabled: false,
    text: 'I hereby declare that the information provided above is true to the best of my knowledge and belief.',
  };

  readonly DEFAULT_DECLARATION_TEXT = this.DEFAULT_DECLARATION.text;

  private readonly generalSectionsKey = 'resume_general_sections';
  private readonly traitsKey = 'resume_traits';

  private resumeData: any = {
    profile: null,
    experience: [],
    education: [],
    skills: [],
    projects: [],
    about: '',
    declaration: this.DEFAULT_DECLARATION,
  };

  private resumeDataSubject = new BehaviorSubject<any>(this.resumeData);
  public resumeData$ = this.resumeDataSubject.asObservable();

  private dataChangedSubject = new Subject<void>();
  public dataChanged$ = this.dataChangedSubject.asObservable();

  private _qrCodeData = new BehaviorSubject<{
    qrDataString: string;
    darkColor: string;
    customFields: any[];
  }>({
    qrDataString: '',
    darkColor: '#000000',
    customFields: [],
  });

  qrCodeData$ = this._qrCodeData.asObservable();

  private declarationSubject = new BehaviorSubject<DeclarationDef>(this.resumeData.declaration);

  public declaration$: Observable<DeclarationDef> = this.declarationSubject.asObservable();

  constructor() {
    this.loadResumeData();
  }

  private loadResumeData() {
    const savedData = localStorage.getItem('resumeData');
    if (savedData) {
      this.resumeData = JSON.parse(savedData);
      this.resumeDataSubject.next(this.resumeData);

      this.declarationSubject.next(this.resumeData.declaration || this.DEFAULT_DECLARATION);
    }
  }

  // Add this call to the end of each save method
  private notifyDataChanged(): void {
    this.dataChangedSubject.next();
  }

  private saveResumeData() {
    localStorage.setItem('resumeData', JSON.stringify(this.resumeData));
    this.resumeDataSubject.next(this.resumeData);
  }

  getProfile() {
    return this.resumeData.profile;
  }

  saveProfile(profile: any) {
    this.resumeData.profile = profile;
    this.saveResumeData();
    this.notifyDataChanged();
  }

  getDeclaration(): DeclarationDef {
    return this.declarationSubject.getValue();
  }

  setDeclaration(declaration: DeclarationDef): void {
    this.declarationSubject.next(declaration);
    this.resumeData.declaration = declaration;
    this.saveResumeData(); // Assuming you have a method to save the entire resume
  }

  updateQrCodeData(data: { qrDataString: string; darkColor: string; customFields: any[] }): void {
    this._qrCodeData.next(data);

    // Save to localStorage for persistence
    localStorage.setItem('resumeQrCodeData', JSON.stringify(data));
  }

  getQrCodeData(): { qrDataString: string; darkColor: string; customFields: any[] } {
    const savedData = localStorage.getItem('resumeQrCodeData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing QR code data', e);
      }
    }
    return this._qrCodeData.value;
  }

  getExperiences() {
    return this.resumeData.experience;
  }

  saveGeneralSections(sections: GeneralSection[]): void {
    try {
      // Make sure we're saving the complete structure
      const dataToSave = JSON.stringify(sections);
      // console.log('Saving data to localStorage:', dataToSave);
      localStorage.setItem(this.generalSectionsKey, dataToSave);
      this.notifyDataChanged();

      // Verify save
      const savedData = localStorage.getItem(this.generalSectionsKey);
      console.log('Verification - data in localStorage:', savedData);
    } catch (error) {
      console.error('Error saving general sections:', error);
    }
  }

  getGeneralSections(): GeneralSection[] {
    try {
      const sectionsData = localStorage.getItem(this.generalSectionsKey);
      if (!sectionsData) {
        return [];
      }

      const parsedData = JSON.parse(sectionsData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Error retrieving general sections:', error);
      return [];
    }
  }

  addExperience(experience: any) {
    this.resumeData.experience.push(experience);
    this.saveResumeData();
    this.notifyDataChanged();
  }

  updateExperience(index: number, experience: any) {
    this.resumeData.experience[index] = experience;
    this.saveResumeData();
    this.notifyDataChanged();
  }

  deleteExperience(index: number) {
    this.resumeData.experience.splice(index, 1);
    this.saveResumeData();
    this.notifyDataChanged();
  }

  getEducation() {
    return this.resumeData.education;
  }

  addEducation(education: any) {
    this.resumeData.education.push(education);
    this.saveResumeData();
    this.notifyDataChanged();
  }

  updateEducation(index: number, education: any) {
    this.resumeData.education[index] = education;
    this.saveResumeData();
    this.notifyDataChanged();
  }

  deleteEducation(index: number) {
    this.resumeData.education.splice(index, 1);
    this.saveResumeData();
    this.notifyDataChanged();
  }

  getSkills() {
    return this.resumeData.skills;
  }

  saveSkills(skills: any) {
    this.resumeData.skills = skills;
    this.saveResumeData();
    this.notifyDataChanged();
  }

  getProjects() {
    return this.resumeData.projects;
  }

  addProject(project: any) {
    this.resumeData.projects.push(project);
    this.saveResumeData();
    this.notifyDataChanged();
  }

  updateProject(index: number, project: any) {
    this.resumeData.projects[index] = project;
    this.saveResumeData();
    this.notifyDataChanged();
  }

  deleteProject(index: number) {
    this.resumeData.projects.splice(index, 1);
    this.saveResumeData();
    this.notifyDataChanged();
  }

  getAbout() {
    return this.resumeData.about;
  }

  saveAbout(about: string) {
    this.resumeData.about = about;
    this.saveResumeData();
    this.notifyDataChanged();
  }

  getResumeData() {
    return this.resumeData;
  }

  cleanLocalStorage(): void {
    localStorage.removeItem('resumeData');
    localStorage.removeItem('resumeCertificates');
    localStorage.removeItem('resumeQrCodeData');
    localStorage.removeItem('resumeLanguages');
    localStorage.removeItem('resumePersonalDetails');
    localStorage.removeItem('resumeDigitalSignature');
    localStorage.removeItem('resumeQrCustomFields');

    this.resumeData = {
      profile: null,
      experience: [],
      education: [],
      skills: [],
      projects: [],
      about: '',
    };
    this.resumeDataSubject.next(this.resumeData);
    this.notifyDataChanged();
  }

  getEmptyProfile(): ProfileInfo {
    return {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      github: '',
      linkedin: '',
      portfolio: '',
      photoUrl: '',
    };
  }

  // Certificate methods
  saveCertificates(certificates: Certificate[]): void {
    localStorage.setItem('resumeCertificates', JSON.stringify(certificates));
    this.notifyDataChanged();
  }

  getCertificates(): Certificate[] {
    const certificates = localStorage.getItem('resumeCertificates');
    return certificates ? JSON.parse(certificates) : [];
  }

  // Language methods
  saveLanguages(languages: Language[]): void {
    localStorage.setItem('resumeLanguages', JSON.stringify(languages));
    this.notifyDataChanged();
  }

  getLanguages(): Language[] {
    const languages = localStorage.getItem('resumeLanguages');
    return languages ? JSON.parse(languages) : [];
  }

  // Personal details methods
  savePersonalDetails(details: PersonalDetails): void {
    localStorage.setItem('resumePersonalDetails', JSON.stringify(details));
    this.notifyDataChanged();
  }

  getPersonalDetails(): PersonalDetails {
    const details = localStorage.getItem('resumePersonalDetails');
    return details ? JSON.parse(details) : {};
  }

  // Get traits from localStorage
  getTraits(): Trait[] {
    try {
      const savedTraits = localStorage.getItem(this.traitsKey);
      if (!savedTraits) {
        return [];
      }

      return JSON.parse(savedTraits);
    } catch (error) {
      console.error('Error retrieving traits from localStorage:', error);
      return [];
    }
  }

  // Save traits to localStorage
  saveTraits(traits: Trait[]): void {
    try {
      localStorage.setItem(this.traitsKey, JSON.stringify(traits));
      this.notifyDataChanged();
      console.log('Traits saved successfully');
    } catch (error) {
      console.error('Error saving traits to localStorage:', error);
    }
  }

  // Delete all traits (clear from localStorage)
  deleteTraits(): void {
    try {
      localStorage.removeItem(this.traitsKey);
      this.notifyDataChanged();
      console.log('Traits deleted successfully');
    } catch (error) {
      console.error('Error deleting traits from localStorage:', error);
    }
  }

  // Delete a specific trait by ID
  deleteTraitById(traitId: string): void {
    try {
      const traits = this.getTraits();
      const updatedTraits = traits.filter(trait => trait.id !== traitId);
      this.saveTraits(updatedTraits);
      console.log(`Trait with ID ${traitId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting trait with ID ${traitId}:`, error);
    }
  }
}
