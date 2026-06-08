import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  FormControl,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { of, throwError } from "rxjs";
import { AddTestSelectionFormComponent } from "./add-test-selection-form.component";
import { WhitespaceValidators } from "@mxflow/validator";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { MandatoryModule } from "@mxflow/directive";
import { DomTestUtils } from "@mxevolve/testing";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";
import { MockComponent, ngMocks } from "ng-mocks";
import { TestSelectionBrowserFormInputComponent } from "@mxevolve/domains/test/widget";
import { TestSelectionDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

describe("Add TestSelection form component", () => {
  let fixture: ComponentFixture<AddTestSelectionFormComponent>;
  let component: AddTestSelectionFormComponent;
  let testDefinitionService: jest.Mocked<TestDefinitionService>;
  let fb: UntypedFormBuilder;
  let toastMessageService: ToastMessageService;
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

  beforeEach(async () => {
    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    featureFlagResolver = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    };
    projectIdResolver = {
      resolve: jest.fn().mockReturnValue("some_project_id"),
    };

    testDefinitionService = {
      addTestSelectionToTestDefinition: jest.fn().mockReturnValue(of({})),
    } as unknown as jest.Mocked<TestDefinitionService>;

    await TestBed.configureTestingModule({
      imports: [
        AddTestSelectionFormComponent,
        ButtonModule,
        ReactiveFormsModule,
        DialogModule,
        MandatoryModule,
        MandatoryFieldModule,
        MockComponent(TestSelectionBrowserFormInputComponent),
        MockComponent(TestSelectionDirectoryPickerComponent),
      ],
      providers: [
        UntypedFormBuilder,
        { provide: TestDefinitionService, useValue: testDefinitionService },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: FeatureFlagResolver, useValue: featureFlagResolver },
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTestSelectionFormComponent);
    component = fixture.componentInstance;
    component.testDefinition = {
      ...testDefinition,
      testSelections: [],
    } as unknown as TestDefinition;
    fb = TestBed.inject(UntypedFormBuilder);
    fixture.detectChanges();
  });

  describe("onInit", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
      expect(component.isAddTestSelectionOpen).toBeFalsy();
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

  describe("closeAddTestSelectionModal", () => {
    it("should reset the form", () => {
      const isAddTestSelectionOpenChangeSpy = jest.spyOn(
        component.isAddTestSelectionOpenChange,
        "emit"
      );
      component.form.patchValue({
        name: "random name",
        path: "random_path",
      });
      component.isAddTestSelectionOpen = true;
      component.form.markAsDirty();
      fixture.detectChanges();
      getCloseButtonHarness().click();

      expect(isAddTestSelectionOpenChangeSpy).toHaveBeenCalledWith(false);
      expect(component.form.get("name")?.value).toBeNull();
      expect(component.form.get("path")?.value).toBeNull();
    });
  });

  describe("onSubmit", () => {
    it("should modify the test selections in the test definition on successful addition", () => {
      const testDefinitionChangeSpy = jest.spyOn(
        component.testDefinitionChange,
        "emit"
      );
      const closeAddTestSelectionModalSpy = jest.spyOn(
        component,
        "closeAddTestSelectionModal"
      );
      const newTestSelection = {
        id: "some_id",
        name: "some_name",
        path: "some_path",
      } as unknown as TestSelection;
      jest
        .spyOn(testDefinitionService, "addTestSelectionToTestDefinition")
        .mockReturnValue(of(newTestSelection));
      component.form = new UntypedFormGroup({
        name: new FormControl("some_name"),
        path: new FormControl("some_path"),
      });
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;

      component.testDefinition = {
        projectId: "some_project_id",
        id: "some_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;
      component.isAddTestSelectionOpen = true;
      component.form.markAsDirty();
      fixture.detectChanges();
      getAddButtonHarness().click();
      expect(testDefinitionChangeSpy).toHaveBeenCalledWith(
        component.testDefinition
      );
      expect(closeAddTestSelectionModalSpy).toHaveBeenCalled();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Test Selection added Successfully!"
      );
      expect(component.isLoading).toBeFalsy();
      expect(component.testDefinition.testSelections).toEqual([
        testSelection,
        newTestSelection,
      ]);
    });
    it("should return an error on unsuccessful addition", () => {
      jest
        .spyOn(testDefinitionService, "addTestSelectionToTestDefinition")
        .mockReturnValue(throwError(() => "error"));
      component.form = new UntypedFormGroup({
        name: new FormControl("some_name"),
        path: new FormControl("some_path"),
      });
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;
      component.isAddTestSelectionOpen = true;

      component.testDefinition = {
        projectId: "some_project_id",
        id: "some_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;
      component.form.markAsDirty();
      fixture.detectChanges();

      getAddButtonHarness().click();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
      expect(component.isLoading).toBeFalsy();
    });
    it("should show invalid inputs when form is wrong", () => {
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;
      component.isAddTestSelectionOpen = true;
      component.testDefinition = {
        projectId: "some_project_id",
        id: "some_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;
      component.form = fb.group({
        name: [
          null,
          [
            Validators.required,
            Validators.maxLength(255),
            WhitespaceValidators.notBlank(),
          ],
        ],
        path: [
          null,
          [
            Validators.required,
            Validators.maxLength(255),
            WhitespaceValidators.notBlank(),
          ],
        ],
      });
      component.isAddTestSelectionOpen = true;

      fixture.detectChanges();

      getCloseButtonHarness().click();
      expect(component.form.get("name")?.invalid).toBeTruthy();
      expect(component.form.get("path")?.invalid).toBeTruthy();
    });
  });

  describe("test selection browser form input integration", () => {
    beforeEach(() => {
      component.isAddTestSelectionOpen = true;
      component.useTestSelectionBrowser = true;
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

    it("should reopen the add test selection dialog when the test selection browser is closed", () => {
      const emitSpy = jest.spyOn(
        component.isAddTestSelectionOpenChange,
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
  });

  describe("when the test objects feature flag is disabled", () => {
    beforeEach(() => {
      component.isAddTestSelectionOpen = true;
      component.useTestSelectionBrowser = false;
      fixture.detectChanges();
    });

    it("given the user wants to add a new test selection then the directory picker should be displayed instead of the test selection browser", () => {
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

    it("given the user wants to add a new test selection when the directory picker is rendered then it should receive the test definition path repository and an empty initial selection", () => {
      const picker = ngMocks.find(
        fixture,
        TestSelectionDirectoryPickerComponent
      );
      expect(ngMocks.input(picker, "basePath")).toBe(testDefinition.path);
      expect(ngMocks.input(picker, "selectedPath")).toBe("");
      expect(ngMocks.input(picker, "repositoryId")).toBe(testDefinition.repoId);
    });
  });

  function getAddButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "add-test-selection-submit-button"
    );
  }

  function getCloseButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "add-test-selection-close-button"
    );
  }
});
