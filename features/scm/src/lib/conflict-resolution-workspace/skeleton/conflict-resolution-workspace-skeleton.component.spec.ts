import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConflictResolutionWorkspaceSkeletonComponent } from "./conflict-resolution-workspace-skeleton.component";

describe("ConflictResolutionWorkspaceSkeletonComponent", () => {
  let fixture: ComponentFixture<ConflictResolutionWorkspaceSkeletonComponent>;
  let component: ConflictResolutionWorkspaceSkeletonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConflictResolutionWorkspaceSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ConflictResolutionWorkspaceSkeletonComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
