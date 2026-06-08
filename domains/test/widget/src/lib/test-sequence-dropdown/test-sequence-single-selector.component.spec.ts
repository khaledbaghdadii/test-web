import { Component } from "@angular/core";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { of } from "rxjs";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { Toast } from "primeng/toast";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import { TestSequenceSingleSelectorComponent } from "./test-sequence-single-selector.component";
import { TestSequenceService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { TestSequenceSummaryModel } from "@mxevolve/domains/test/model";
import { Repository, RepositoryService } from "@mxflow/features/repository";

const PROJECT_ID = "project-1234";
const REPOSITORY_ID = "repo-5678";
const DEFAULT_BRANCH = "main";

const VALID_SEQUENCES: TestSequenceSummaryModel[] = [
  { id: "seq-001", name: "test/mxtest/ALL_Init/config" },
  { id: "seq-002", name: "test/mxtest/RATES/config" },
  { id: "seq-003", name: "test/mxtest/FX/config" },
];

function mockTestSequenceService(): Partial<TestSequenceService> {
  return {
    fetchTestSequences: jest.fn(() => of(VALID_SEQUENCES)),
  } as Partial<TestSequenceService>;
}

function mockRepositoryService(): Partial<RepositoryService> {
  return {
    getRepoById: jest.fn(() =>
      of({ defaultBranch: DEFAULT_BRANCH } as Repository)
    ),
  } as Partial<RepositoryService>;
}

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-test-sequence-single-selector
        [projectId]="projectId"
        [repositoryId]="repositoryId"
        formControlName="path"
      />
    </form>
  `,
  imports: [TestSequenceSingleSelectorComponent, ReactiveFormsModule],
})
class SingleSelectFormWrapperComponent {
  projectId = PROJECT_ID;
  repositoryId = REPOSITORY_ID;
  form = new FormGroup({
    path: new FormControl<string | undefined>(undefined),
  });
}

function getComponent(
  componentType: typeof TestSequenceSingleSelectorComponent
): TestSequenceSingleSelectorComponent {
  return ngMocks.find<TestSequenceSingleSelectorComponent>(componentType)
    .componentInstance;
}

describe("TestSequenceSingleSelectorComponent", () => {
  let fixture: MockedComponentFixture<SingleSelectFormWrapperComponent>;
  let component: TestSequenceSingleSelectorComponent;
  let toastMessageService: ToastMessageService;

  beforeEach(async () => {
    await MockBuilder(SingleSelectFormWrapperComponent)
      .keep(TestSequenceSingleSelectorComponent)
      .keep(ReactiveFormsModule)
      .provide(provideNoopAnimations())
      .mock(MxevolveSingleSelectDropdownComponent)
      .mock(Toast)
      .mock(ToastMessageService)
      .mock(TestSequenceService, mockTestSequenceService())
      .mock(RepositoryService, mockRepositoryService());

    fixture = MockRender(SingleSelectFormWrapperComponent);
    component = getComponent(TestSequenceSingleSelectorComponent);
    toastMessageService = ngMocks.get(ToastMessageService);
    jest.spyOn(toastMessageService, "showWarning");

    component.stateProvider.setDataParams({
      projectId: PROJECT_ID,
      repositoryId: REPOSITORY_ID,
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("given the component is rendered, then test sequences should be fetched with the correct project and repository ids", () => {
    const service = ngMocks.get(TestSequenceService);

    expect(service.fetchTestSequences).toHaveBeenCalledWith(
      PROJECT_ID,
      REPOSITORY_ID,
      DEFAULT_BRANCH
    );
  });

  it("given no repository is selected, then the system should not attempt to fetch test sequences and the dropdown should be empty", () => {
    const service = ngMocks.get(TestSequenceService);
    jest.clearAllMocks();

    component.stateProvider.setDataParams({
      projectId: PROJECT_ID,
      repositoryId: null,
    });
    fixture.detectChanges();

    expect(service.fetchTestSequences).not.toHaveBeenCalled();
    expect(component.stateProvider.dropdownOptions()).toEqual([]);
  });

  it("given the sequences are loaded, then dropdown options should be populated with sequence paths", () => {
    const options = component.stateProvider.dropdownOptions();

    expect(options.length).toBe(3);
    expect(options.map((o) => o.label)).toEqual([
      "test/mxtest/ALL_Init/config",
      "test/mxtest/RATES/config",
      "test/mxtest/FX/config",
    ]);
  });

  it("given the user selects a sequence, then the form value should be the sequence path", () => {
    const formWrapper = fixture.componentInstance;
    const selectedSequence = VALID_SEQUENCES[0];

    component.onSelectionChange(selectedSequence);
    fixture.detectChanges();

    expect(formWrapper.form.value.path).toBe("test/mxtest/ALL_Init/config");
  });

  it("given the user clears the selection, then the form value should be undefined", () => {
    const formWrapper = fixture.componentInstance;

    component.onSelectionChange(VALID_SEQUENCES[0]);
    fixture.detectChanges();

    component.onSelectionChange(null);
    fixture.detectChanges();

    expect(formWrapper.form.value.path).toBeUndefined();
  });

  it("given the form is prefilled with a path matching a loaded sequence path, then the matching item should be selected and no warning shown", () => {
    const formWrapper = fixture.componentInstance;

    formWrapper.form.patchValue({ path: "test/mxtest/RATES/config" });
    fixture.detectChanges();

    expect(component.stateProvider.selectedItem()).toEqual(VALID_SEQUENCES[1]);
    expect(toastMessageService.showWarning).not.toHaveBeenCalled();
  });

  it("given the form is prefilled with a path that is not valid anymore, then a sequence should still be shown with form retaining the value but a warning toast should be emitted that the sequence is not longer valid", () => {
    const formWrapper = fixture.componentInstance;
    const stalePath = "test/mxtest/DELETED/config";

    formWrapper.form.patchValue({ path: stalePath });
    fixture.detectChanges();

    expect(component.stateProvider.selectedItem()).toEqual({
      id: stalePath,
      name: stalePath,
    });
    expect(formWrapper.form.value.path).toBe(stalePath);
    expect(toastMessageService.showWarning).toHaveBeenCalledWith(
      `The previously selected test sequence '${stalePath}' is no longer available.`,
      "Test Sequence Unavailable"
    );
  });

  it("given an error occurs loading sequences, then a failure event should be emitted", () => {
    const errorSpy = jest.fn();
    component.failureEvent.subscribe(errorSpy);

    component.onError("Failed to load test sequences");

    expect(errorSpy).toHaveBeenCalledWith("Failed to load test sequences");
  });
});
