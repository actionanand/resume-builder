import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoverLetter } from './cover-letter';

describe('CoverLetter', () => {
  let component: CoverLetter;
  let fixture: ComponentFixture<CoverLetter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoverLetter],
    }).compileComponents();

    fixture = TestBed.createComponent(CoverLetter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
