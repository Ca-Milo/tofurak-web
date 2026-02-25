import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankingFull } from './ranking-full';

describe('RankingFull', () => {
  let component: RankingFull;
  let fixture: ComponentFixture<RankingFull>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingFull]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RankingFull);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
