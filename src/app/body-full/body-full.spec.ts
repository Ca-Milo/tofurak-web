import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BodyFull } from './body-full';

describe('BodyFull', () => {
  let component: BodyFull;
  let fixture: ComponentFixture<BodyFull>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BodyFull]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BodyFull);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
