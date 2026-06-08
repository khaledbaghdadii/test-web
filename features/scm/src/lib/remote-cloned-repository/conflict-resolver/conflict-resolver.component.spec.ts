import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConflictResolverComponent } from "./conflict-resolver.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { of, Subject, throwError } from "rxjs";

const projectId = "test-project-id";
const remoteClonedRepositoryId = "test-repo-id";

describe("ConflictResolverComponent", () => {
  let component: ConflictResolverComponent;
  let fixture: ComponentFixture<ConflictResolverComponent>;
  let remoteClonedRepositoryService: jest.Mocked<RemoteClonedRepositoryService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;

  beforeEach(async () => {
    jest.useFakeTimers();
    remoteClonedRepositoryService = {
      saveBundleChanges: jest.fn().mockReturnValue(of(undefined)),
      applyFunctionalFixes: jest.fn().mockReturnValue(of(undefined)),
    } as unknown as jest.Mocked<RemoteClonedRepositoryService>;

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    await TestBed.configureTestingModule({
      imports: [ConflictResolverComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(ConflictResolverComponent, {
        set: {
          providers: [
            {
              provide: RemoteClonedRepositoryService,
              useValue: remoteClonedRepositoryService,
            },
            {
              provide: ToastMessageService,
              useValue: toastMessageService,
            },
          ],
          imports: [],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConflictResolverComponent);
    component = fixture.componentInstance;
    component.projectId = projectId;
    component.remoteClonedRepositoryId = remoteClonedRepositoryId;
    component.conflictResultsString = "";
  });

  afterEach(() => {
    component.ngOnDestroy();
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it("should have dialogVisible set to false by default", () => {
      expect(component.dialogVisible).toBe(false);
    });

    it("should have disabled set to false by default", () => {
      expect(component.disabled).toBe(false);
    });

    it("should have isLoading set to false by default", () => {
      expect(component.isLoading).toBe(false);
    });

    it("should accept conflictResultsString as required input", () => {
      component.conflictResultsString = "test-value";
      expect(component.conflictResultsString).toBe("test-value");
    });
  });

  describe("openDialog", () => {
    it("should set dialogVisible to true when openDialog is called", () => {
      component.openDialog();

      expect(component.dialogVisible).toBe(true);
    });
  });

  describe("onConflictsResultUpdated", () => {
    it("Should_UpdateConflictResultsString_When_ConflictsResultUpdated", () => {
      const updatedResult = "updated-conflicts";

      component.onConflictsResultUpdated(updatedResult);

      expect(component.conflictResultsString).toBe(updatedResult);
    });

    it("Should_CallSaveBundleChanges_When_ConflictsResultUpdated", () => {
      remoteClonedRepositoryService.saveBundleChanges.mockReturnValue(
        of(undefined)
      );

      component.onConflictsResultUpdated("test-content");
      jest.advanceTimersByTime(350);

      expect(
        remoteClonedRepositoryService.saveBundleChanges
      ).toHaveBeenCalledWith({
        projectId,
        remoteClonedRepositoryId,
        payload: { content: "test-content" },
      });
    });

    it("Should_DebounceMultipleSaves_When_CalledRapidly", () => {
      remoteClonedRepositoryService.saveBundleChanges.mockReturnValue(
        of(undefined)
      );

      component.onConflictsResultUpdated("content-1");
      component.onConflictsResultUpdated("content-2");
      component.onConflictsResultUpdated("content-3");
      jest.advanceTimersByTime(350);

      expect(
        remoteClonedRepositoryService.saveBundleChanges
      ).toHaveBeenCalledTimes(1);
      expect(
        remoteClonedRepositoryService.saveBundleChanges
      ).toHaveBeenCalledWith({
        projectId,
        remoteClonedRepositoryId,
        payload: { content: "content-3" },
      });
    });
  });

  describe("onApplyAllChanges", () => {
    it("Should_ShowSuccessToast_When_ApplySucceeds", () => {
      remoteClonedRepositoryService.applyFunctionalFixes.mockReturnValue(
        of(undefined)
      );

      component.onApplyAllChanges();

      expect(
        remoteClonedRepositoryService.applyFunctionalFixes
      ).toHaveBeenCalledWith({
        projectId,
        remoteClonedRepositoryId,
      });
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Apply changes requested successfully."
      );
      expect(component.isLoading).toBe(false);
    });

    it("Should_ShowErrorToast_When_ApplyFails", () => {
      remoteClonedRepositoryService.applyFunctionalFixes.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      component.onApplyAllChanges();

      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "Failed to apply changes: Network error"
      );
      expect(component.isLoading).toBe(false);
    });

    it("Should_SetLoadingTrue_When_ApplyIsInProgress", () => {
      const subject = new Subject<void>();
      remoteClonedRepositoryService.applyFunctionalFixes.mockReturnValue(
        subject
      );

      component.onApplyAllChanges();

      expect(component.isLoading).toBe(true);

      subject.next();
      subject.complete();

      expect(component.isLoading).toBe(false);
    });
  });

  describe("ngOnDestroy", () => {
    it("Should_CompleteSubscriptions_When_Destroyed", () => {
      const subject = new Subject<void>();
      remoteClonedRepositoryService.applyFunctionalFixes.mockReturnValue(
        subject
      );

      component.onApplyAllChanges();
      expect(subject.observed).toBe(true);

      component.ngOnDestroy();
      expect(subject.observed).toBe(false);
    });
  });
});
