import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralSections } from './general-sections';

describe('GeneralSections', () => {
  let component: GeneralSections;
  let fixture: ComponentFixture<GeneralSections>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralSections],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralSections);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
