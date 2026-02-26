import { TestBed } from '@angular/core/testing';

import { Hart } from './hart';

describe('Hart', () => {
  let service: Hart;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Hart);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
