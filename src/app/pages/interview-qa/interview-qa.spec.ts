import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewQa } from './interview-qa';

describe('InterviewQa', () => {
  let component: InterviewQa;
  let fixture: ComponentFixture<InterviewQa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewQa],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewQa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
