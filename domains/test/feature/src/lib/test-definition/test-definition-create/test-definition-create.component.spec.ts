import { TestDefinitionCreateComponent } from "./test-definition-create.component";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { EMPTY, of, throwError } from "rxjs";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { ToastMessageService, MandatoryFieldModule } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { FormBuilder } from "@angular/forms";
import { Select } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { MockComponent } from "ng-mocks";
import { CardContainerModule } from "@mxflow/ui/container";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";
import { TestSequenceSingleSelectorComponent } from "@mxevolve/domains/test/widget";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { CreateTestDefinitionRequest } from "@mxevolve/domains/test/model";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { TestPackageDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";

const projectId = "projectId";
const repositoryId = "repositoryId";
const repositoryName = "repositoryName";
const repositoryLabel = "repositoryLabel";
const repositoryUrl = "repositoryUrl";
const repositoryCredentialsId = "repositoryCredentialsId";
const repositoryDefaultBranch = "repositoryDefaultBranch";
const repository = getRepositories();
const errorMessage = "errorMessage";
const name = "dir3";
const path = "dir3/dir3";
const description = "description";
const createTestDefinitionRequest = getCreateTestDefinitionRequest();
const createTestDefinitionRequestWithDefaultTimeout =
  getCreateTestDefinitionRequestWithDefaultTimeout();
const testDefinitionId = "testDefinitionId";
const formControls = getFormControls();

describe("Test Definition Create Component Test", () => {
  let formBuilder: FormBuilder;
  let testDefinitionService: TestDefinitionService;
  let repositoryService: RepositoryService;
  let store: Store;
  let router: Router;
  let route: ActivatedRoute;
  let testDefinitionCreationForm: any;
  let toastMessageService: ToastMessageService;
  let featureFlagResolver: FeatureFlagResolver;
  let fixture: ComponentFixture<TestDefinitionCreateComponent>;

  let testDefinitionCreateComponent: TestDefinitionCreateComponent;

  beforeEach(() => {
    formBuilder = {
      group: jest.fn(() => ({
        get: jest.fn(() => ({ valueChanges: EMPTY })),
      })),
    } as unknown as FormBuilder;
    testDefinitionService = {
      create: jest.fn(() => of(testDefinitionId)),
    } as unknown as TestDefinitionService;
    repositoryService = {
      getTestRepositories: jest.fn(() => of(repository)),
    } as unknown as RepositoryService;
    store = {
      select: jest.fn(() => of(projectId)),
    } as unknown as Store;
    router = {
      navigate: jest.fn(() => Promise.resolve()),
    } as unknown as Router;
    route = {} as unknown as ActivatedRoute;
    testDefinitionCreationForm = {
      valid: true,
      value: {
        path: path,
        description: description,
        timeout: 1,
        repoId: repositoryId,
      },
      reset: jest.fn(),
    };
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;
    featureFlagResolver = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    } as unknown as FeatureFlagResolver;

    TestBed.configureTestingModule({
      imports: [
        TestDefinitionCreateComponent,
        Select,
        ButtonModule,
        CardModule,
        CardContainerModule,
        MxflowSpinnerModule,
        MandatoryFieldModule,
        MockComponent(TestSequenceSingleSelectorComponent),
        MockComponent(TestPackageDirectoryPickerComponent),
      ],
      providers: [
        { provide: FormBuilder, useValue: formBuilder },
        { provide: TestDefinitionService, useValue: testDefinitionService },
        { provide: RepositoryService, useValue: repositoryService },
        { provide: Store, useValue: store },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: FeatureFlagResolver, useValue: featureFlagResolver },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestDefinitionCreateComponent);
    testDefinitionCreateComponent = fixture.componentInstance;
    testDefinitionCreateComponent.testDefinitionCreationForm =
      testDefinitionCreationForm;
  });

  it("should set is loading to true on init", () => {
    jest
      .spyOn(repositoryService, "getTestRepositories")
      .mockImplementation(() => {
        expect(testDefinitionCreateComponent.isLoading).toStrictEqual(true);
        return of(repository);
      });

    testDefinitionCreateComponent.ngOnInit();
  });

  it("should get the project id on init", () => {
    testDefinitionCreateComponent.ngOnInit();

    expect(store.select).toHaveBeenCalledWith(GlobalSelectors.getProjectId);
    expect(testDefinitionCreateComponent.projectId).toStrictEqual(projectId);
  });

  it("should get the repositories on init using the correct project id and set is loading to false", () => {
    testDefinitionCreateComponent.ngOnInit();

    expect(repositoryService.getTestRepositories).toHaveBeenCalledWith(
      projectId
    );
    expect(testDefinitionCreateComponent.repositories).toStrictEqual(
      repository
    );
    expect(testDefinitionCreateComponent.isLoading).toStrictEqual(false);
  });

  it("should throw an error if it fails to fetch repositories and set is loading to false", () => {
    jest
      .spyOn(repositoryService, "getTestRepositories")
      .mockReturnValue(throwError(() => errorMessage));
    testDefinitionCreateComponent.ngOnInit();

    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should set is loading to true on submit if the form is valid", () => {
    jest.spyOn(testDefinitionService, "create").mockImplementation(() => {
      expect(testDefinitionCreateComponent.isLoading).toStrictEqual(true);
      return of(testDefinitionId);
    });
    testDefinitionCreateComponent.testDefinitionCreationForm =
      testDefinitionCreationForm;

    testDefinitionCreateComponent.onSubmit();
  });

  it("should create test definition on submit if the form is valid with correct request", () => {
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(testDefinitionService.create).toHaveBeenCalledWith(
      projectId,
      createTestDefinitionRequest
    );
  });

  it("should default the timeout to 24 if no timeout is provided", () => {
    testDefinitionCreationForm = {
      valid: true,
      value: {
        path: path,
        description: description,
        timeout: undefined,
        repoId: repositoryId,
      },
    };
    testDefinitionCreateComponent.testDefinitionCreationForm =
      testDefinitionCreationForm;
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(testDefinitionService.create).toHaveBeenCalledWith(
      projectId,
      createTestDefinitionRequestWithDefaultTimeout
    );
  });

  it("should set is loading to false if the tpk was created successfully", () => {
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(testDefinitionCreateComponent.isLoading).toStrictEqual(false);
  });

  it("should display a message that the tpk was created successfully", () => {
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "Test Definition Successfully Created"
    );
  });

  it("should reset the form if the tpk was created successfully", () => {
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(testDefinitionCreationForm.reset).toHaveBeenCalled();
  });

  it("should navigate to the tpk definition page if it was created successfully", () => {
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(
      ["../details", testDefinitionId],
      { relativeTo: route }
    );
  });

  it("should set is loading to false and show error message if it fails to create tpk", () => {
    jest
      .spyOn(testDefinitionService, "create")
      .mockReturnValue(throwError(() => errorMessage));
    testDefinitionCreateComponent.testDefinitionCreationForm =
      testDefinitionCreationForm;
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(testDefinitionCreateComponent.isLoading).toStrictEqual(false);
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should mark the invalid control as dirty if the form group is invalid", () => {
    testDefinitionCreationForm = {
      valid: false,
      value: {
        path: path,
        description: description,
        timeout: 1,
        repoId: repositoryId,
      },
      reset: jest.fn(),
      controls: formControls,
    };
    testDefinitionCreateComponent.testDefinitionCreationForm =
      testDefinitionCreationForm;
    testDefinitionCreateComponent.projectId = projectId;
    testDefinitionCreateComponent.onSubmit();

    expect(formControls[0].markAsDirty).toHaveBeenCalled();
    expect(formControls[0].updateValueAndValidity).toHaveBeenCalledWith({
      onlySelf: true,
    });
    expect(formControls[1].markAsDirty).toHaveBeenCalled();
    expect(formControls[1].updateValueAndValidity).toHaveBeenCalledWith({
      onlySelf: true,
    });
    expect(formControls[2].markAsDirty).not.toHaveBeenCalled();
    expect(formControls[2].updateValueAndValidity).not.toHaveBeenCalledWith({
      onlySelf: true,
    });
  });

  it("should navigate back on cancel", () => {
    testDefinitionCreateComponent.onCancel();

    expect(router.navigate).toHaveBeenCalledWith(["../"], {
      relativeTo: route,
    });
  });

  describe("when the test objects feature flag is enabled", () => {
    const nameWhenFlagEnabled = "dir3";
    const pathFormValueWhenFlagEnabled = "dir3";

    beforeEach(() => {
      testDefinitionCreationForm = {
        valid: true,
        value: {
          path: pathFormValueWhenFlagEnabled,
          description: description,
          timeout: 1,
          repoId: repositoryId,
        },
        reset: jest.fn(),
      };
      testDefinitionCreateComponent.testDefinitionCreationForm =
        testDefinitionCreationForm;
      testDefinitionCreateComponent.useTestSequenceSelector = true;
    });

    it("given a request is received to create a test definition, then the name should be the bare sequence name and the path should be prefixed with base path", () => {
      testDefinitionCreateComponent.projectId = projectId;
      testDefinitionCreateComponent.onSubmit();

      expect(testDefinitionService.create).toHaveBeenCalledWith(projectId, {
        repoId: repositoryId,
        name: nameWhenFlagEnabled,
        path: `common/mxtest/test_packages/${nameWhenFlagEnabled}`,
        description: description,
        timeoutDuration: { days: 0, hours: 1, minutes: 0 },
      });
    });
  });

  it("given the user changes the repository selection, then the path field should be cleared", () => {
    testDefinitionCreateComponent["formBuilder"] = new FormBuilder();
    testDefinitionCreateComponent.ngOnInit();
    testDefinitionCreateComponent.testDefinitionCreationForm.controls[
      "path"
    ].setValue(path);

    testDefinitionCreateComponent.testDefinitionCreationForm.controls[
      "repoId"
    ].setValue("new-repo-id3");

    expect(
      testDefinitionCreateComponent.testDefinitionCreationForm.controls["path"]
        .value
    ).toBeNull();
  });

  it("given the component is destroyed, then changing the repository selection should no longer clear the path", () => {
    testDefinitionCreateComponent["formBuilder"] = new FormBuilder();
    testDefinitionCreateComponent.ngOnInit();
    testDefinitionCreateComponent.testDefinitionCreationForm.controls[
      "path"
    ].setValue(path);

    testDefinitionCreateComponent.ngOnDestroy();
    testDefinitionCreateComponent.testDefinitionCreationForm.controls[
      "repoId"
    ].setValue("new-repo-id");

    expect(
      testDefinitionCreateComponent.testDefinitionCreationForm.controls["path"]
        .value
    ).toBe(path);
  });
});

function getRepositories(): Repository[] {
  return [
    {
      id: repositoryId,
      name: repositoryName,
      label: repositoryLabel,
      url: repositoryUrl,
      credentialsId: repositoryCredentialsId,
      defaultBranch: repositoryDefaultBranch,
    },
  ];
}

function getCreateTestDefinitionRequest(): CreateTestDefinitionRequest {
  return {
    repoId: repositoryId,
    name: name,
    path: path,
    description: description,
    timeoutDuration: {
      days: 0,
      hours: 1,
      minutes: 0,
    },
  };
}

function getCreateTestDefinitionRequestWithDefaultTimeout(): CreateTestDefinitionRequest {
  return {
    repoId: repositoryId,
    name: name,
    path: path,
    description: description,
    timeoutDuration: {
      days: 0,
      hours: 24,
      minutes: 0,
    },
  };
}

function getFormControls() {
  return [
    {
      invalid: true,
      markAsDirty: jest.fn(),
      updateValueAndValidity: jest.fn(),
    },
    {
      invalid: true,
      markAsDirty: jest.fn(),
      updateValueAndValidity: jest.fn(),
    },
    {
      invalid: false,
      markAsDirty: jest.fn(),
      updateValueAndValidity: jest.fn(),
    },
  ];
}
