import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuideComplete } from './guide-complete';

describe('GuideComplete', () => {
  let component: GuideComplete;
  let fixture: ComponentFixture<GuideComplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuideComplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuideComplete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
