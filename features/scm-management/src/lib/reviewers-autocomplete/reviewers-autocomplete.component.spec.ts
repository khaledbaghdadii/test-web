import { NO_ERRORS_SCHEMA, signal } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ReviewersAutoCompleteComponent } from "./reviewers-autocomplete.component";
import { AutoCompleteCompleteEvent } from "primeng/autocomplete";
import { SendForReviewStateService } from "./state-service/send-for-review-state.service";
import { LazyLoadEvent } from "primeng/api";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { v4 as uuid4 } from "uuid";
import { NEVER, of, throwError } from "rxjs";
import { ScmManagementService, ScmService } from "@mxflow/features/scm";
import { provideNoopAnimations } from "@angular/platform-browser/animations";

const DEVELOPMENT = {
  name: uuid4(),
  id: uuid4(),
  repository: {
    id: uuid4(),
  },
};
const REVIEWER = {
  displayName: uuid4(),
  name: uuid4(),
};
const destinationBranch = uuid4();
const ERROR_MESSAGE = "ERROR";

const projectId = uuid4();
describe("Reviewers AutoComplete Component", () => {
  let sendForReviewStateService: any;
  let component: ReviewersAutoCompleteComponent;
  let fixture: ComponentFixture<ReviewersAutoCompleteComponent>;
  let scmService: ScmService;
  let scmManagementService: ScmManagementService;

  function initMocks() {
    sendForReviewStateService = {
      setProjectId: jest.fn(),
      setPageIndex: jest.fn(),
      setFilterReset: jest.fn(),
      setFilter: jest.fn(),
      errorMessage: signal(undefined),
      reviewerSuggestions: signal(undefined),
      isLastPage: signal(false),
      isLoadingData: signal(false),
      pageIndex: signal(0),
    };
    scmService = {
      getDefaultReviewers: jest.fn(() =>
        of({
          content: [REVIEWER],
        })
      ),
    } as unknown as jest.Mocked<ScmService>;

    scmManagementService = {
      getDevelopment: jest.fn(() => of(DEVELOPMENT)),
    } as unknown as jest.Mocked<ScmManagementService>;
  }
  function initComponent() {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideNoopAnimations()],
      imports: [ReactiveFormsModule, ReviewersAutoCompleteComponent],
    })
      .overrideComponent(ReviewersAutoCompleteComponent, {
        set: {
          providers: [
            {
              provide: SendForReviewStateService,
              useValue: sendForReviewStateService,
            },
            { provide: ScmService, useValue: scmService },
            { provide: ScmManagementService, useValue: scmManagementService },
          ],
        },
      })
      .compileComponents();
    provideNoopAnimations();
    fixture = TestBed.createComponent(ReviewersAutoCompleteComponent);
    component = fixture.componentInstance;

    component.projectId = projectId;
    component.sourceDevelopmentId = DEVELOPMENT.id;
    component.reviewersFormControl = new FormControl();
    component.destinationBranchFormControl = new FormControl({
      branchName: destinationBranch,
    });
    fixture.detectChanges();
  }
  beforeEach(() => {
    initMocks();
    initComponent();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
  describe("handleReviewerSuggestionsScroll", () => {
    it("should not scroll if the final reviewers page is reached", () => {
      sendForReviewStateService.isLastPage.set(true);
      sendForReviewStateService.isLoadingData.set(false);
      sendForReviewStateService.reviewerSuggestions.set([{ name: "name" }]);
      const lazyLoadEvent = {
        last: 5,
      } as unknown as LazyLoadEvent;

      component.handleReviewerSuggestionsScroll(lazyLoadEvent);

      expect(sendForReviewStateService.setPageIndex).not.toHaveBeenCalled();
    });
    it("should not scroll if the reviewer data is still loading", () => {
      sendForReviewStateService.isLastPage.set(false);
      sendForReviewStateService.isLoadingData.set(true);
      sendForReviewStateService.reviewerSuggestions.set([{ name: "name" }]);
      const lazyLoadEvent = {
        last: 5,
      } as unknown as LazyLoadEvent;

      component.handleReviewerSuggestionsScroll(lazyLoadEvent);

      expect(sendForReviewStateService.setPageIndex).not.toHaveBeenCalled();
    });

    it("should not scroll if the reviewer list is bigger than the last index + itemsStep", () => {
      sendForReviewStateService.isLastPage.set(false);
      sendForReviewStateService.isLoadingData.set(false);
      const objectsArray = Array.from({ length: 20 }, (_, i) => ({
        name: `name-${i}`,
      }));
      sendForReviewStateService.reviewerSuggestions.set(objectsArray);
      const lazyLoadEvent = {
        last: 5,
      } as unknown as LazyLoadEvent;

      component.handleReviewerSuggestionsScroll(lazyLoadEvent);

      expect(sendForReviewStateService.setPageIndex).not.toHaveBeenCalled();
    });

    it("should scroll if all conditions are met", () => {
      sendForReviewStateService.isLastPage.set(false);
      sendForReviewStateService.isLoadingData.set(false);
      sendForReviewStateService.reviewerSuggestions.set([{ name: "name" }]);
      const lazyLoadEvent = {
        last: 5,
      } as unknown as LazyLoadEvent;

      component.handleReviewerSuggestionsScroll(lazyLoadEvent);

      expect(sendForReviewStateService.setPageIndex).toHaveBeenCalled();
    });
  });

  describe("getMatchingReviewers", () => {
    it("should set provided values", () => {
      const autoCompleteEvent = {
        query: "some_string",
      } as AutoCompleteCompleteEvent;

      component.getMatchingReviewers(autoCompleteEvent);

      expect(sendForReviewStateService.setFilterReset).toHaveBeenCalledWith(
        true
      );
      expect(sendForReviewStateService.setPageIndex).toHaveBeenCalledWith(0);
      expect(sendForReviewStateService.setFilter).toHaveBeenCalledWith(
        "some_string"
      );
    });
  });
  describe("Error event emitter", () => {
    it("should emit error message on error", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.errorMessageChange, "emit");

      sendForReviewStateService.errorMessage.set(ERROR_MESSAGE);
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(ERROR_MESSAGE);
    }));
  });
  describe("Getting default reviewers", () => {
    it("should not show default reviewers warning message before fetching them", () => {
      expect(component.showReviewersWarningMessage).toBeFalsy();
    });
    it("should not show the default reviewers warning message if fetching them was successful", fakeAsync(() => {
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      expect(component.showReviewersWarningMessage).toBeFalsy();
    }));
    it("should show the default reviewers warning message if an error occurred while fetching them", fakeAsync(() => {
      jest
        .spyOn(scmService, "getDefaultReviewers")
        .mockReturnValue(throwError(() => new Error(uuid4())));
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      expect(component.showReviewersWarningMessage).toBeTruthy();
    }));
    it("should hide the default reviewers warning message when fetching them again if an error occurred while fetching before", fakeAsync(() => {
      jest
        .spyOn(scmService, "getDefaultReviewers")
        .mockReturnValue(throwError(() => new Error(uuid4())));
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      expect(component.showReviewersWarningMessage).toBeTruthy();
      jest.spyOn(scmService, "getDefaultReviewers").mockReturnValue(
        of({
          content: [REVIEWER],
        })
      );
      component.destinationBranchFormControl.setValue({
        branchName: uuid4(),
      });
      tick();
      fixture.detectChanges();
      expect(component.showReviewersWarningMessage).toBeFalsy();
    }));

    it("should not try to resolve default reviewers if the destination branch is not provided", () => {
      const newFixture = TestBed.createComponent(
        ReviewersAutoCompleteComponent
      );
      const newComponent = newFixture.componentInstance;

      jest.clearAllMocks();

      newComponent.projectId = projectId;
      newComponent.sourceDevelopmentId = DEVELOPMENT.id;
      newComponent.reviewersFormControl = new FormControl();
      newComponent.destinationBranchFormControl =
        undefined as unknown as FormControl;

      newComponent.ngOnInit();
      newFixture.detectChanges();

      expect(scmService.getDefaultReviewers).not.toHaveBeenCalled();
      expect(scmManagementService.getDevelopment).not.toHaveBeenCalled();
    });

    it("should resolve default reviewers", () => {
      expect(scmManagementService.getDevelopment).toHaveBeenCalledWith(
        projectId,
        DEVELOPMENT.id
      );
      expect(scmService.getDefaultReviewers).toHaveBeenCalledWith({
        sourceBranch: DEVELOPMENT.name,
        projectId: projectId,
        targetBranch: destinationBranch,
        repositoryId: DEVELOPMENT.repository.id,
      });
    });

    it("should update the default reviewers with the resolved ones", fakeAsync(() => {
      fixture.detectChanges();
      expect(component.reviewersFormControl.value).toEqual([
        { name: REVIEWER.name, displayName: REVIEWER.displayName },
      ]);
    }));

    it("should resolve the default reviewers again when the destination branch changes", fakeAsync(() => {
      const newDestinationBranch = uuid4();
      component.destinationBranchFormControl.setValue({
        branchName: newDestinationBranch,
      });
      tick();
      fixture.detectChanges();
      expect(scmService.getDefaultReviewers).toHaveBeenCalledWith({
        projectId: projectId,
        repositoryId: DEVELOPMENT.repository.id,
        sourceBranch: DEVELOPMENT.name,
        targetBranch: newDestinationBranch,
      });
    }));
    it("should indicate that default reviewers loading when it is fetching them", fakeAsync(() => {
      jest.spyOn(scmService, "getDefaultReviewers").mockReturnValue(NEVER);
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.defaultReviewersLoading).toBeTruthy();
    }));
    it("should indicate that default reviewers are not loading when it has fetched them", fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.defaultReviewersLoading).toBeFalsy();
    }));
    it("should indicate that default reviewers are not loading when it fails to fetch them", fakeAsync(() => {
      jest
        .spyOn(scmService, "getDefaultReviewers")
        .mockReturnValue(throwError(() => new Error(uuid4())));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.defaultReviewersLoading).toBeFalsy();
    }));
    it("should reset the reviewers form control if fetching default reviewers fails", fakeAsync(() => {
      jest
        .spyOn(scmService, "getDefaultReviewers")
        .mockReturnValue(throwError(() => new Error(uuid4())));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.reviewersFormControl.value).toEqual([]);
    }));
  });
});
