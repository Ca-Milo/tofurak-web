import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsComplete } from './news-complete';

describe('NewsComplete', () => {
  let component: NewsComplete;
  let fixture: ComponentFixture<NewsComplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsComplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsComplete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
