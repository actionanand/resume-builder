import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Traits } from './traits';

describe('Traits', () => {
  let component: Traits;
  let fixture: ComponentFixture<Traits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Traits],
    }).compileComponents();

    fixture = TestBed.createComponent(Traits);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
