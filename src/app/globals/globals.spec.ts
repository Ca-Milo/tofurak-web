import { TestBed } from '@angular/core/testing';

import { Globals } from './globals';

describe('Globals', () => {
  let service: Globals;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Globals);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
