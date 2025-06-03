/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
  resumeData$ = this.resumeDataSubject.asObservable();

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
  }

  updateExperience(index: number, experience: any) {
    this.resumeData.experience[index] = experience;
    this.saveResumeData();
  }

  deleteExperience(index: number) {
    this.resumeData.experience.splice(index, 1);
    this.saveResumeData();
  }

  getEducation() {
    return this.resumeData.education;
  }

  addEducation(education: any) {
    this.resumeData.education.push(education);
    this.saveResumeData();
  }

  updateEducation(index: number, education: any) {
    this.resumeData.education[index] = education;
    this.saveResumeData();
  }

  deleteEducation(index: number) {
    this.resumeData.education.splice(index, 1);
    this.saveResumeData();
  }

  getSkills() {
    return this.resumeData.skills;
  }

  saveSkills(skills: any) {
    this.resumeData.skills = skills;
    this.saveResumeData();
  }

  getProjects() {
    return this.resumeData.projects;
  }

  addProject(project: any) {
    this.resumeData.projects.push(project);
    this.saveResumeData();
  }

  updateProject(index: number, project: any) {
    this.resumeData.projects[index] = project;
    this.saveResumeData();
  }

  deleteProject(index: number) {
    this.resumeData.projects.splice(index, 1);
    this.saveResumeData();
  }

  getAbout() {
    return this.resumeData.about;
  }

  saveAbout(about: string) {
    this.resumeData.about = about;
    this.saveResumeData();
  }

  getResumeData() {
    return this.resumeData;
  }

  exportAsMarkdown(): string {
    const data = this.resumeData;
    let markdown = '';

    // Profile
    if (data.profile) {
      markdown += `# ${data.profile.fullName}\n`;
      markdown += `## ${data.profile.title}\n\n`;
      markdown += `📧 ${data.profile.email} | 📱 ${data.profile.phone} | 📍 ${data.profile.location}\n\n`;

      const socialLinks = [];
      if (data.profile.github) socialLinks.push(`[GitHub](${data.profile.github})`);
      if (data.profile.linkedin) socialLinks.push(`[LinkedIn](${data.profile.linkedin})`);
      if (data.profile.stackoverflow) socialLinks.push(`[Stack Overflow](${data.profile.stackoverflow})`);
      if (data.profile.portfolio) socialLinks.push(`[Portfolio](${data.profile.portfolio})`);

      if (socialLinks.length) {
        markdown += socialLinks.join(' | ') + '\n\n';
      }
    }

    // About
    if (data.about) {
      markdown += `## About Me\n\n${data.about}\n\n`;
    }

    // Skills
    if (data.skills && data.skills.length) {
      markdown += `## Skills\n\n`;
      data.skills.forEach((skillGroup: any) => {
        markdown += `### ${skillGroup.category}\n`;
        markdown += skillGroup.skills.join(', ') + '\n\n';
      });
    }

    // Experience
    if (data.experience && data.experience.length) {
      markdown += `## Experience\n\n`;
      data.experience.forEach((exp: any) => {
        markdown += `### ${exp.position} | ${exp.company}\n`;
        markdown += `${exp.startDate} - ${exp.endDate || 'Present'} | ${exp.location}\n\n`;
        markdown += `${exp.description}\n\n`;

        if (exp.achievements && exp.achievements.length) {
          markdown += `Key Achievements:\n`;
          exp.achievements.forEach((achievement: string) => {
            markdown += `- ${achievement}\n`;
          });
          markdown += '\n';
        }
      });
    }

    // Projects
    if (data.projects && data.projects.length) {
      markdown += `## Projects\n\n`;
      data.projects.forEach((project: any) => {
        markdown += `### ${project.name}\n`;
        if (project.link) markdown += `[Project Link](${project.link})\n\n`;
        markdown += `${project.description}\n\n`;

        if (project.technologies) {
          markdown += `Technologies: ${project.technologies}\n\n`;
        }
      });
    }

    // Education
    if (data.education && data.education.length) {
      markdown += `## Education\n\n`;
      data.education.forEach((edu: any) => {
        markdown += `### ${edu.degree}\n`;
        markdown += `${edu.institution}, ${edu.location}\n`;
        markdown += `${edu.startDate} - ${edu.endDate}\n`;
        // Add this line to include CGPA in the markdown export
        if (edu.cgpa) markdown += `**CGPA/Percentage:** ${edu.cgpa}\n`;
        if (edu.description) markdown += `\n${edu.description}\n\n`;
        else markdown += `\n`;
      });
    }

    return markdown;
  }
}
