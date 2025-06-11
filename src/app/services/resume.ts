/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';

import { BehaviorSubject, Subject } from 'rxjs';

import { Certificate, Language, PersonalDetails, ProfileInfo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private resumeData: any = {
    profile: null,
    experience: [],
    education: [],
    skills: [],
    projects: [],
    about: '',
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

  constructor() {
    this.loadResumeData();
  }

  private loadResumeData() {
    const savedData = localStorage.getItem('resumeData');
    if (savedData) {
      this.resumeData = JSON.parse(savedData);
      this.resumeDataSubject.next(this.resumeData);
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
}
