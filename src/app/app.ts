import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Profile } from './components/profile/profile';
import { Education } from './components/education/education';
import { Skills } from './components/skills/skills';
import { ExperienceComponent } from './components/experience/experience';
import { ProjectsComponent } from './components/projects/projects';
import { About } from './components/about/about';
import { QrCode } from './components/qr-code/qr-code';
import { Export } from './components/export/export';
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
    ExperienceComponent,
    Skills,
    ProjectsComponent,
    About,
    QrCode,
    Export
  ],
  providers: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Resume Builder';
}
