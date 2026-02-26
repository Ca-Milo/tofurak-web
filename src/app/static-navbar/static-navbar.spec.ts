import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaticNavbar } from './static-navbar';

describe('StaticNavbar', () => {
  let component: StaticNavbar;
  let fixture: ComponentFixture<StaticNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaticNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaticNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
