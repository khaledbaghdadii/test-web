import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { of, throwError } from "rxjs";
import {
  EditTestSelectionForm,
  EditTestSelectionFormComponent,
} from "./edit-test-selection-form.component";
import { WhitespaceValidators } from "@mxflow/validator";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MandatoryModule } from "@mxflow/directive";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { SkeletonModule } from "primeng/skeleton";
import { DomTestUtils } from "@mxevolve/testing";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";
import { MockComponent, ngMocks } from "ng-mocks";
import { TestSelectionBrowserFormInputComponent } from "@mxevolve/domains/test/widget";
import { TestSelectionDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

describe("Edit TestSelection form component", () => {
  let fixture: ComponentFixture<EditTestSelectionFormComponent>;
  let component: EditTestSelectionFormComponent;
  let testDefinitionService: any;
  let toastMessageService: any;
  let featureFlagResolver: { isFeatureEnabled: jest.Mock };
  let projectIdResolver: { resolve: jest.Mock };

  const testDefinition = {
    projectId: "some_project_id",
    id: "some_id",
    repoId: "repo_id",
    name: "sequence-a",
    path: "common/mxtest/test_packages/sequence-a",
    testSelections: [],
  } as unknown as TestDefinition;

  beforeEach(() => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    };

    featureFlagResolver = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    };
    projectIdResolver = {
      resolve: jest.fn().mockReturnValue("some_project_id"),
    };

    testDefinitionService = {
      editTestSelectionInTestDefinition: jest.fn().mockReturnValue(of({})),
    } as unknown as jest.Mocked<TestDefinitionService>;
    TestBed.configureTestingModule({
      imports: [
        EditTestSelectionFormComponent,
        ButtonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        MandatoryModule,
        MandatoryFieldModule,
        NoopAnimationsModule,
        SkeletonModule,
        MockComponent(TestSelectionBrowserFormInputComponent),
        MockComponent(TestSelectionDirectoryPickerComponent),
      ],
      providers: [
        { provide: UntypedFormBuilder },
        {
          provide: TestDefinitionService,
          useValue: testDefinitionService,
        },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: FeatureFlagResolver, useValue: featureFlagResolver },
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
      ],
    });

    fixture = TestBed.createComponent(EditTestSelectionFormComponent);
    component = fixture.componentInstance;

    component.testDefinition = {
      ...testDefinition,
      testSelections: [],
    } as unknown as TestDefinition;
    fixture.detectChanges();
  });

  describe("onInit", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
      expect(component.isEditTestSelectionOpen).toBeFalsy();
      expect(component.form.get("name")?.value).toBeNull();
      expect(component.form.get("path")?.value).toBeNull();
    });

    it("should fetch feature flag with the the correct project id resolved and flag", () => {
      expect(featureFlagResolver.isFeatureEnabled).toHaveBeenCalledWith(
        "some_project_id",
        "test-objects"
      );
    });
  });

  describe("ngOnDestroy", () => {
    it("should complete the destroy subject", () => {
      const completeSpy = jest.spyOn(component["destroy$"], "complete");

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("ngOnChanges", () => {
    it("should set the form to the testSelection values", () => {
      const name = "some_name";
      const path = "some_path";

      component.testSelection = {
        name: name,
        path: path,
        id: "some_id",
        tags: ["tag1"],
      };
      fixture.detectChanges();
      expect(component.form.value.name).toEqual(name);
      expect(component.form.value.path).toEqual(path);
    });
  });

  describe("closeEditTestSelectionModal", () => {
    it("should close the dialog and reset the form to testSelection values", () => {
      component.form = new FormGroup<EditTestSelectionForm>({
        name: new FormControl<string | null>(null, [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ]),
        path: new FormControl<string | null>(null, [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ]),
      });
      component.form.setValue({ name: "some_name", path: "some_path" });
      const testSelectionName = "some_other_name";
      const testSelectionPath = "some_other_path";
      component.testSelection = {
        name: "some_other_name",
        path: "some_other_path",
        id: "some_other_id",
        tags: ["tag1"],
      };
      const isEditTestSelectionOpenChangeSpy = jest.spyOn(
        component.isEditTestSelectionOpenChange,
        "emit"
      );
      component.closeEditTestSelectionModal();
      expect(isEditTestSelectionOpenChangeSpy).toHaveBeenCalledWith(false);
      const formValue = component.form.value;
      const actualName = formValue.name;
      const actualPath = formValue.path;
      expect(actualName).toEqual(testSelectionName);
      expect(actualPath).toEqual(testSelectionPath);
    });
  });

  describe("onSubmit", () => {
    it("should modify the test selections in the test definition on successful edit", () => {
      const testDefinitionChangeSpy = jest.spyOn(
        component.testDefinitionChange,
        "emit"
      );
      const closeEditTestSelectionModalSpy = jest.spyOn(
        component,
        "closeEditTestSelectionModal"
      );
      const newTestSelection = {
        id: "some_id",
        name: "some_new_name",
        path: "some_path",
      } as unknown as TestSelection;
      jest
        .spyOn(testDefinitionService, "editTestSelectionInTestDefinition")
        .mockReturnValue(of(newTestSelection));
      component.form = new UntypedFormGroup({
        name: new FormControl("some_new_name"),
        path: new FormControl("some_path"),
      });
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;
      component.testSelection = testSelection;

      component.testDefinition = {
        projectId: "some_project_id",
        id: "some_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;

      component.onSubmit();
      expect(testDefinitionChangeSpy).toHaveBeenCalledWith(
        component.testDefinition
      );
      expect(closeEditTestSelectionModalSpy).toHaveBeenCalled();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Test Selection edited Succesfully!"
      );
      expect(component.isLoading).toBeFalsy();
      expect(component.testDefinition.testSelections).toEqual([
        newTestSelection,
      ]);
    });
    it("should return an error on unsuccesful edit", () => {
      jest
        .spyOn(testDefinitionService, "editTestSelectionInTestDefinition")
        .mockReturnValue(throwError(() => "error"));
      component.form = new UntypedFormGroup({
        name: new FormControl("some_name"),
        path: new FormControl("some_path"),
      });
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;
      component.testSelection = testSelection;

      component.testDefinition = {
        projectId: "some_project_id",
        id: "some_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;
      component.onSubmit();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
      expect(component.isLoading).toBeFalsy();
    });
    it("should show invalid inputs when form is wrong", () => {
      component.form = new FormGroup<EditTestSelectionForm>({
        name: new FormControl<string | null>(null, [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ]),
        path: new FormControl<string | null>(null, [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ]),
      });
      component.onSubmit();
      expect(component.form.get("name")?.invalid).toBeTruthy();
      expect(component.form.get("path")?.invalid).toBeTruthy();
    });
  });
  describe("dom tests", () => {
    it("should call onSubmit when submit button is clicked", () => {
      component.form.patchValue({
        name: "random name",
        path: "random_path",
      });
      const onSubmitSpy = jest.spyOn(component, "onSubmit");
      component.isEditTestSelectionOpen = true;
      component.form.markAsDirty();
      fixture.detectChanges();
      getButtonHarness("edit-test-selection-submit-button").click();
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });
    it("should call closeAddTestSelectionModal when cancel button is clicked", () => {
      component.form.patchValue({
        name: "random name",
        path: "random_path",
      });
      const onCloseSpy = jest.spyOn(component, "closeEditTestSelectionModal");
      component.isEditTestSelectionOpen = true;
      component.form.markAsDirty();
      fixture.detectChanges();
      getButtonHarness("edit-test-selection-cancel-button").click();
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("test selection browser form input integration", () => {
    beforeEach(() => {
      component.isEditTestSelectionOpen = true;
      component.testDefinition = {
        ...testDefinition,
        testSelections: [],
      } as unknown as TestDefinition;
      fixture.detectChanges();
    });

    it("should render the form input when not loading and testDefinition is set", () => {
      const input = ngMocks.find(
        fixture,
        TestSelectionBrowserFormInputComponent,
        null
      );
      expect(input).not.toBeNull();
    });

    it("should pass inputs to the form input", () => {
      const input = ngMocks.find(
        fixture,
        TestSelectionBrowserFormInputComponent
      );
      expect(ngMocks.input(input, "projectId")).toBe(testDefinition.projectId);
      expect(ngMocks.input(input, "repositoryId")).toBe(testDefinition.repoId);
      expect(ngMocks.input(input, "testSequenceName")).toBe(
        testDefinition.name
      );
    });

    it("should update the path form control when the form input emits a path", () => {
      const input = ngMocks.find(
        fixture,
        TestSelectionBrowserFormInputComponent
      );
      ngMocks.change(input, "Root/Child/Leaf");
      fixture.detectChanges();
      expect(component.form.get("path")?.value).toBe("Root/Child/Leaf");
    });

    it("should reopen the edit test selection dialog when the test selection browser is closed", () => {
      const emitSpy = jest.spyOn(
        component.isEditTestSelectionOpenChange,
        "emit"
      );
      const input = ngMocks.find(
        fixture,
        TestSelectionBrowserFormInputComponent
      );
      ngMocks.output(input, "dialogVisibleChange").emit(false);
      expect(emitSpy).toHaveBeenCalledWith(true);
    });

    it("should hide the form input when isLoading is true", () => {
      component.isLoading = true;
      fixture.detectChanges();
      const input = ngMocks.find(
        fixture,
        TestSelectionBrowserFormInputComponent,
        null
      );
      expect(input).toBeNull();
    });

    it("should prefill the form input when test selection has a path", () => {
      const input = ngMocks.find(
        fixture,
        TestSelectionBrowserFormInputComponent
      );
      const writeValueSpy = jest.spyOn(input.componentInstance, "writeValue");
      component.testSelection = {
        name: "some_name",
        path: "Root/Pre/Filled",
        id: "1",
        tags: [],
      };
      fixture.detectChanges();
      expect(writeValueSpy).toHaveBeenCalledWith("Root/Pre/Filled");
    });
  });

  describe("when the test objects feature flag is disabled", () => {
    beforeEach(() => {
      component.isEditTestSelectionOpen = true;
      component.useTestSequenceSelector = false;
      component.testDefinition = {
        ...testDefinition,
        testSelections: [],
      } as unknown as TestDefinition;
      fixture.detectChanges();
    });

    it("given that the user wants to edit a test selection then the directory picker should be displayed instead of the test selection browser", () => {
      const picker = ngMocks.find(
        fixture,
        TestSelectionDirectoryPickerComponent,
        null
      );
      const browserInput = ngMocks.find(
        fixture,
        TestSelectionBrowserFormInputComponent,
        null
      );
      expect(picker).not.toBeNull();
      expect(browserInput).toBeNull();
    });

    it("given that the user wants to edit a test selection when the directory picker is rendered then it should receive the test definition path repository and an empty initial selection", () => {
      const picker = ngMocks.find(
        fixture,
        TestSelectionDirectoryPickerComponent
      );
      expect(ngMocks.input(picker, "basePath")).toBe(testDefinition.path);
      expect(ngMocks.input(picker, "selectedPath")).toBe("");
      expect(ngMocks.input(picker, "repositoryId")).toBe(testDefinition.repoId);
    });
  });

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }
});
