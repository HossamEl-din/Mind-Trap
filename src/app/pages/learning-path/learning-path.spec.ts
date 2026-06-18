import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningPath } from './learning-path';

describe('LearningPath', () => {
  let component: LearningPath;
  let fixture: ComponentFixture<LearningPath>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningPath],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningPath);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
