import { TestBed } from '@angular/core/testing';

import { Breadcrumb } from './breadcrumb';

describe('Breadcrumb', () => {
  let service: Breadcrumb;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Breadcrumb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
