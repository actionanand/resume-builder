import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Languages } from './languages';

describe('Languages', () => {
  let component: Languages;
  let fixture: ComponentFixture<Languages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Languages],
    }).compileComponents();

    fixture = TestBed.createComponent(Languages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
