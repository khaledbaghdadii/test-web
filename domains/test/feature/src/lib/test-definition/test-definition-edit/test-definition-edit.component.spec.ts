import { Repository, RepositoryService } from "@mxflow/features/repository";
import { TestDefinitionEditComponent } from "./test-definition-edit.component";
import { of, throwError } from "rxjs";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfirmationService } from "primeng/api";
import { Store } from "@ngrx/store";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder } from "@angular/forms";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Location } from "@angular/common";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import {
  TestDefinition,
  EditTestDefinitionRequest,
} from "@mxevolve/domains/test/model";
import { MockComponent } from "ng-mocks";
import { TestSequenceSingleSelectorComponent } from "@mxevolve/domains/test/widget";
import { TestPackageDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

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
const path = "dir1/dir2/dir3";
const description = "description";
const editTestDefinitionRequest = getEditTestDefinitionRequest();
const editTestDefinitionRequestWithDefaultTimeout =
  getEditTestDefinitionRequestWithDefaultTimeout();
const testDefinitionId = "testDefinitionId";

const testDefinition = getTestDefinition();
const formControls = getFormControls();

describe("Test Definition Edit Component Test", () => {
  let formBuilder: FormBuilder;
  let testDefinitionService: TestDefinitionService;
  let repositoryService: RepositoryService;
  let store: Store;
  let router: Router;
  let route: ActivatedRoute;
  let confirmationService: ConfirmationService;
  let location: Location;
  let testDefinitionEditForm: any;
  let toastMessageService: ToastMessageService;
  let featureFlagResolver: FeatureFlagResolver;

  let testDefinitionEditComponent: TestDefinitionEditComponent;
  let fixture: ComponentFixture<TestDefinitionEditComponent>;

  beforeEach(() => {
    const formValues = {
      path: path,
      description: description,
      timeout: 1,
      repoId: repositoryId,
    };

    testDefinitionEditForm = {
      valid: true,
      value: formValues,
      get: jest.fn(() => {
        return {
          getRawValue: jest.fn(() => repositoryId),
        };
      }),
      reset: jest.fn(),
      controls: formControls,
    };
    formBuilder = {
      group: jest.fn(() => testDefinitionEditForm),
    } as unknown as FormBuilder;
    testDefinitionService = {
      fetch: jest.fn(() => of(testDefinition)),
      edit: jest.fn(() => of(testDefinition)),
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
    route = {
      params: of({
        testDefinitionId: testDefinitionId,
      }),
    } as unknown as ActivatedRoute;
    location = {
      back: jest.fn(),
    } as unknown as Location;
    confirmationService = {
      confirm: jest.fn(),
    } as unknown as ConfirmationService;
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;
    featureFlagResolver = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    } as unknown as FeatureFlagResolver;

    TestBed.overrideComponent(TestDefinitionEditComponent, {
      set: {
        imports: [
          MockComponent(TestSequenceSingleSelectorComponent),
          MockComponent(TestPackageDirectoryPickerComponent),
        ],
        providers: [
          { provide: ToastMessageService, useValue: toastMessageService },
          { provide: ConfirmationService, useValue: confirmationService },
          { provide: Store, useValue: store },
          { provide: ActivatedRoute, useValue: route },
          { provide: Router, useValue: router },
          { provide: Location, useValue: location },
          { provide: RepositoryService, useValue: repositoryService },
          { provide: TestDefinitionService, useValue: testDefinitionService },
          { provide: FormBuilder, useValue: formBuilder },
          { provide: FeatureFlagResolver, useValue: featureFlagResolver },
        ],
      },
    });

    fixture = TestBed.createComponent(TestDefinitionEditComponent);
    testDefinitionEditComponent = fixture.componentInstance;
    testDefinitionEditComponent.testDefinitionEditForm = testDefinitionEditForm;
  });

  it("should set is loading to true on init", () => {
    route = {
      params: of(() => {
        expect(testDefinitionEditComponent.isLoading).toStrictEqual(true);
        return {
          testDefinitionId: testDefinitionId,
        };
      }),
    } as unknown as ActivatedRoute;

    testDefinitionEditComponent.ngOnInit();
  });

  it("should get the test definition id from the route params", () => {
    testDefinitionEditComponent.ngOnInit();

    expect(testDefinitionEditComponent.testDefinitionId).toStrictEqual(
      testDefinitionId
    );
  });

  it("should get the project id on init", () => {
    testDefinitionEditComponent.ngOnInit();

    expect(store.select).toHaveBeenCalledWith(GlobalSelectors.getProjectId);
    expect(testDefinitionEditComponent.projectId).toStrictEqual(projectId);
  });

  it("should get the repositories on init using the correct project id", () => {
    testDefinitionEditComponent.ngOnInit();

    expect(repositoryService.getTestRepositories).toHaveBeenCalledWith(
      projectId
    );
    expect(testDefinitionEditComponent.repositories).toStrictEqual(repository);
  });

  it("should get the test definition using the correct test definition", () => {
    testDefinitionEditComponent.ngOnInit();

    expect(testDefinitionService.fetch).toHaveBeenCalledWith(
      testDefinitionId,
      projectId
    );
  });

  it("should set the form control initial values", () => {
    testDefinitionEditComponent.ngOnInit();

    expect(formControls.repoId.disable).toHaveBeenCalled();
    expect(formControls.repoId.setValue).toHaveBeenCalledWith(repositoryId);
    expect(formControls.path.setValue).toHaveBeenCalledWith(path);
    expect(formControls.description.setValue).toHaveBeenCalledWith(description);
    expect(formControls.timeout.setValue).toHaveBeenCalledWith(1);
  });

  it("should set is loading to false", () => {
    testDefinitionEditComponent.ngOnInit();

    expect(testDefinitionEditComponent.isLoading).toStrictEqual(false);
  });

  it("should throw an error if it fails to fetch repositories and set is loading to false", () => {
    jest
      .spyOn(repositoryService, "getTestRepositories")
      .mockReturnValue(throwError(() => errorMessage));
    testDefinitionEditComponent.ngOnInit();

    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should open a confirm dialog on confirm submit", () => {
    const event = {} as Event;
    testDefinitionEditComponent.confirmSubmit(event);

    expect(confirmationService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptLabel: "OK",
        rejectLabel: "Cancel",
        target: event.target ? event.target : undefined,
        message:
          "If you updated the package path, make sure to update the test selections if needed.",
        icon: "pi pi-exclamation-triangle",
      })
    );
  });

  it("should set is loading to true on submit if the form is valid", () => {
    testDefinitionService = {
      getTestDefinition: jest.fn(() => of(testDefinition)),
      editTestDefinition: jest.fn(() => {
        expect(testDefinitionEditComponent.isLoading).toStrictEqual(true);
        return of();
      }),
    } as unknown as TestDefinitionService;
    testDefinitionEditComponent.testDefinitionEditForm = testDefinitionEditForm;

    testDefinitionEditComponent.submit();
  });

  it("should edit test definition on submit if the form is valid with correct request", () => {
    testDefinitionEditComponent.projectId = projectId;
    testDefinitionEditComponent.testDefinitionId = testDefinitionId;
    testDefinitionEditComponent.submit();

    expect(testDefinitionService.edit).toHaveBeenCalledWith(
      projectId,
      testDefinitionId,
      editTestDefinitionRequest
    );
  });

  it("should default the timeout to 24 if no timeout is provided", () => {
    testDefinitionEditForm = {
      valid: true,
      value: {
        path: path,
        description: description,
        timeout: undefined,
        repoId: repositoryId,
      },
      get: jest.fn(() => {
        return {
          getRawValue: jest.fn(() => repositoryId),
        };
      }),
    };
    testDefinitionEditComponent.testDefinitionEditForm = testDefinitionEditForm;
    testDefinitionEditComponent.projectId = projectId;
    testDefinitionEditComponent.testDefinitionId = testDefinitionId;
    testDefinitionEditComponent.submit();

    expect(testDefinitionService.edit).toHaveBeenCalledWith(
      projectId,
      testDefinitionId,
      editTestDefinitionRequestWithDefaultTimeout
    );
  });

  it("should set is loading to false if the tpk was created successfully", () => {
    testDefinitionEditComponent.projectId = projectId;
    testDefinitionEditComponent.testDefinitionId = testDefinitionId;
    testDefinitionEditComponent.submit();

    expect(testDefinitionEditComponent.isLoading).toStrictEqual(false);
  });

  it("should display a message that the tpk was created successfully", () => {
    testDefinitionEditComponent.projectId = projectId;
    testDefinitionEditComponent.testDefinitionId = testDefinitionId;
    testDefinitionEditComponent.submit();

    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "Test Definition Successfully Edited"
    );
  });

  it("should navigate to the tpk definition page if it was created successfully", () => {
    testDefinitionEditComponent.projectId = projectId;
    testDefinitionEditComponent.testDefinitionId = testDefinitionId;
    testDefinitionEditComponent.submit();

    expect(router.navigate).toHaveBeenCalledWith(
      ["../../details", testDefinitionId],
      { relativeTo: route }
    );
  });

  it("should set is loading to false and display error message if it fails to create tpk", () => {
    jest
      .spyOn(testDefinitionService, "edit")
      .mockReturnValue(throwError(() => errorMessage));
    testDefinitionEditComponent.testDefinitionEditForm = testDefinitionEditForm;
    testDefinitionEditComponent.submit();

    expect(testDefinitionEditComponent.isLoading).toStrictEqual(false);

    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should mark the invalid control as dirty if the form group is invalid", () => {
    testDefinitionEditForm = {
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
    testDefinitionEditComponent.testDefinitionEditForm = testDefinitionEditForm;
    testDefinitionEditComponent.submit();

    expect(formControls.repoId.markAsDirty).toHaveBeenCalled();
    expect(formControls.repoId.updateValueAndValidity).toHaveBeenCalledWith({
      onlySelf: true,
    });
    expect(formControls.path.markAsDirty).toHaveBeenCalled();
    expect(formControls.path.updateValueAndValidity).toHaveBeenCalledWith({
      onlySelf: true,
    });
    expect(formControls.timeout.markAsDirty).not.toHaveBeenCalled();
    expect(
      formControls.timeout.updateValueAndValidity
    ).not.toHaveBeenCalledWith({ onlySelf: true });
    expect(formControls.description.markAsDirty).not.toHaveBeenCalled();
    expect(
      formControls.description.updateValueAndValidity
    ).not.toHaveBeenCalledWith({ onlySelf: true });
  });

  it("should navigate back on cancel", () => {
    testDefinitionEditComponent.onCancel();
    expect(location.back).toHaveBeenCalled();
  });

  describe("when the test-objects feature flag is enabled", () => {
    const nameWhenFlagEnabled = "dir3";
    const pathFormValueWhenFlagEnabled = "dir3";
    const mockGetRawValue = jest.fn(() => repositoryId);

    beforeEach(() => {
      testDefinitionEditForm = {
        valid: true,
        value: {
          path: pathFormValueWhenFlagEnabled,
          description: description,
          timeout: 1,
          repoId: repositoryId,
        },
        get: jest.fn(() => ({
          getRawValue: mockGetRawValue,
        })),
        reset: jest.fn(),
      };
      testDefinitionEditComponent.testDefinitionEditForm =
        testDefinitionEditForm;
      testDefinitionEditComponent.useTestSequenceSelector = true;
    });

    it("given a request is received to edit a test definition, then the name should be the bare sequence name and the path should be prefixed with the base path", () => {
      testDefinitionEditComponent.projectId = projectId;
      testDefinitionEditComponent.testDefinitionId = testDefinitionId;
      testDefinitionEditComponent.submit();

      expect(testDefinitionService.edit).toHaveBeenCalledWith(
        projectId,
        testDefinitionId,
        {
          repoId: repositoryId,
          name: nameWhenFlagEnabled,
          path: `common/mxtest/test_packages/${nameWhenFlagEnabled}`,
          description: description,
          timeoutDuration: { days: 0, hours: 1, minutes: 0 },
        }
      );
    });
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

function getTestDefinition(): TestDefinition {
  return {
    id: testDefinitionId,
    projectId: projectId,
    repoId: repositoryId,
    name: name,
    path: path,
    description: description,
    timeoutDuration: {
      days: 0,
      hours: 1,
      minutes: 0,
    },
    testSelections: [],
  };
}

function getEditTestDefinitionRequest(): EditTestDefinitionRequest {
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

function getEditTestDefinitionRequestWithDefaultTimeout(): EditTestDefinitionRequest {
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
  return {
    repoId: {
      invalid: true,
      setValue: jest.fn(),
      disable: jest.fn(),
      markAsDirty: jest.fn(),
      updateValueAndValidity: jest.fn(),
    },
    path: {
      invalid: true,
      setValue: jest.fn(),
      markAsDirty: jest.fn(),
      updateValueAndValidity: jest.fn(),
    },
    description: {
      invalid: false,
      setValue: jest.fn(),
      markAsDirty: jest.fn(),
      updateValueAndValidity: jest.fn(),
    },
    timeout: {
      invalid: false,
      setValue: jest.fn(),
      markAsDirty: jest.fn(),
      updateValueAndValidity: jest.fn(),
    },
  };
}
