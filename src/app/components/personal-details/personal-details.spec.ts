import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalDetails } from './personal-details';

describe('PersonalDetails', () => {
  let component: PersonalDetails;
  let fixture: ComponentFixture<PersonalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
