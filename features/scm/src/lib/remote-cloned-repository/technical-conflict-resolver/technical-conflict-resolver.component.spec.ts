import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TechnicalConflictResolverComponent } from "./technical-conflict-resolver.component";

const projectId = "test-project-id";
const remoteClonedRepositoryId = "test-repo-id";

describe("TechnicalConflictResolverComponent", () => {
  let component: TechnicalConflictResolverComponent;
  let fixture: ComponentFixture<TechnicalConflictResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicalConflictResolverComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicalConflictResolverComponent);
    fixture.componentRef.setInput("projectId", projectId);
    fixture.componentRef.setInput(
      "remoteClonedRepositoryId",
      remoteClonedRepositoryId
    );
    component = fixture.componentInstance;
  });

  describe("initial state", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it("should have dialogVisible set to false by default", () => {
      expect(component.dialogVisible()).toBe(false);
    });
  });

  describe("openDialog", () => {
    it("should set dialogVisible to true", () => {
      component.openDialog();

      expect(component.dialogVisible()).toBe(true);
    });
  });

  describe("closeDialog", () => {
    it("should set dialogVisible to false", () => {
      component.openDialog();

      component.closeDialog();

      expect(component.dialogVisible()).toBe(false);
    });

    it("should emit closed event", () => {
      const closedSpy = jest.fn();
      component.closed.subscribe(closedSpy);

      component.closeDialog();

      expect(closedSpy).toHaveBeenCalledTimes(1);
    });
  });
});
