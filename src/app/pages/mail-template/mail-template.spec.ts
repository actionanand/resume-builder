import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailTemplate } from './mail-template';

describe('MailTemplate', () => {
  let component: MailTemplate;
  let fixture: ComponentFixture<MailTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailTemplate],
    }).compileComponents();

    fixture = TestBed.createComponent(MailTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
