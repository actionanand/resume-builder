export interface EducationEntry {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
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
