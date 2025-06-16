import { Component, OnInit, OnDestroy, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { debounceTime, Subject, Subscription } from 'rxjs';

import { ResumeService } from '../../services/resume';
import { DeclarationDef } from '../../models';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.html',
  styleUrls: ['./declaration.scss'],
  imports: [CommonModule, FormsModule],
})
export class Declaration implements OnInit, OnDestroy {
  @Output() navigate = new EventEmitter<string>();

  declaration: DeclarationDef = {
    enabled: false,
    text: '',
  };

  isEditorFocused: boolean = false;
  private textChanges = new Subject<string>();

  private subscription: Subscription = new Subscription();

  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    // Subscribe to declaration changes
    this.subscription.add(
      this.resumeService.declaration$.subscribe(declaration => {
        this.declaration = { ...declaration };
      }),
    );

    // Set up debounced text saving
    this.subscription.add(
      this.textChanges
        .pipe(
          debounceTime(800), // Save after typing stops for 800ms
        )
        .subscribe(() => {
          this.saveDeclaration();
        }),
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  saveDeclaration(): void {
    this.resumeService.setDeclaration({ ...this.declaration });
  }

  autoSave(): void {
    this.textChanges.next(this.declaration.text);
  }

  resetToDefault(): void {
    this.declaration.text = this.resumeService.DEFAULT_DECLARATION_TEXT;
    this.saveDeclaration();
  }

  onEditorFocus(): void {
    this.isEditorFocused = true;
  }

  onEditorBlur(): void {
    this.isEditorFocused = false;
    this.saveDeclaration();
  }

  goToPreviousSection(): void {
    this.saveDeclaration();
    this.navigate.emit('personalDetails');
  }

  goToNextSection(): void {
    this.saveDeclaration();
    this.navigate.emit('qr-code');
  }
}
