export interface EducationEntry {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  cgpa: string;
}

export interface Experience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  achievements: string[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string;
  link: string;
  image?: string;
}

export interface ProfileInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  portfolio: string;
  photoUrl?: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  date: string;
  expiration?: string;
  credentialId?: string;
  url?: string;
  description?: string;
}

export interface Language {
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic';
}

export interface PersonalDetails {
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  maritalStatus?: string;
  gender?: string;
  fathersName?: string;
  mothersName?: string;
  husbandName?: string;
  hobbies?: string[];
  religion?: string;
  passportNumber?: string;
  drivingLicense?: string;
  bloodGroup?: string;
  hasSiblings?: boolean;
  siblingCount?: number;
  otherInfo?: { key: string; value: string }[];
}

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  subtitleColor: string;
  lineColor: string;
  lightShade: string;
  ultraLightShade: string;
}

export interface DeclarationDef {
  enabled: boolean;
  text: string;
}
