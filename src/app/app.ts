import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Profile } from './components/profile/profile';
// import { ExperienceComponent } from './components/experience/experience';
import { Education } from './components/education/education';
// import { SkillsComponent } from './components/skills/skills.component';
// import { ProjectsComponent } from './components/projects/projects.component';
// import { AboutComponent } from './components/about/about.component';
// import { QrCodeComponent } from './components/qr-code/qr-code.component';
// import { ExportComponent } from './components/export/export.component';
// import { ResumeService } from './services/resume.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    Profile,
    Education,
    // ExperienceComponent,
    // SkillsComponent,
    // ProjectsComponent,
    // AboutComponent,
    // QrCodeComponent,
    // ExportComponent
  ],
  providers: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Resume Builder';
}
