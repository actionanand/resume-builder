import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'resume', loadComponent: () => import('./pages/resume/resume').then(m => m.Resume) },
  { path: 'cover-letter', loadComponent: () => import('./pages/cover-letter/cover-letter').then(m => m.CoverLetter) },
  { path: 'interview-qa', loadComponent: () => import('./pages/interview-qa/interview-qa').then(m => m.InterviewQa) },
  {
    path: 'mail-template',
    loadComponent: () => import('./pages/mail-template/mail-template').then(m => m.MailTemplate),
  },
  { path: '**', loadComponent: () => import('./pages/page-not-found/page-not-found').then(m => m.PageNotFound) },
];
