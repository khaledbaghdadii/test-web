import { TestBed } from "@angular/core/testing";
import { LaunchTechnicalReseedModalComponent } from "./launch-technical-reseed-modal.component";
import {
  DropdownDefaultSelectionMode,
  FinalProduct,
  FinalProductDropdownInputComponent,
  FinalProductDropdownInputLabelMode,
} from "@mxflow/features/artifact-manager";
import { ReactiveFormsModule } from "@angular/forms";
import {
  LaunchTechnicalReseedOperationRequest,
  LaunchTechnicalReseedOperationResponse,
} from "../technical-reseed-models";
import { TechnicalReseedService } from "../service/technical-reseed.service";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { MaintenanceConfiguration } from "@mxflow/features/environment";

const PROJECT_ID = "projectId";
const EXECUTION_GROUP_ID = "groupId";
const INFRA_GROUP = "infraGroup";
const TARGET_BRANCH = "targetBranch";

describe("Launch Technical Reseed Modal Component", () => {
  let component: LaunchTechnicalReseedModalComponent;
  let technicalReseedService: TechnicalReseedService;

  beforeEach(() => {
    technicalReseedService = {
      launchTechnicalReseed: jest.fn(),
    } as unknown as TechnicalReseedService;

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        LaunchTechnicalReseedModalComponent,
        { provide: TechnicalReseedService, useValue: technicalReseedService },
      ],
    });

    component = TestBed.inject(LaunchTechnicalReseedModalComponent);
    component.projectId = PROJECT_ID;
    component.infraGroup = INFRA_GROUP;
    component.executionGroupId = EXECUTION_GROUP_ID;
    component.targetBranch = TARGET_BRANCH;

    component.finalProductDropdownComponent = {
      clearSelectedOption: jest.fn(),
    } as unknown as FinalProductDropdownInputComponent;

    jest
      .spyOn(technicalReseedService, "launchTechnicalReseed")
      .mockReturnValue(of(getResponse()));
  });

  it("should set label mode correctly on init", () => {
    component.ngOnInit();
    expect(component.labelMode).toBe(
      FinalProductDropdownInputLabelMode.TAG_COMMIT_ID
    );
  });

  it("should set the dropdown selection mode correctly on init", () => {
    component.ngOnInit();
    expect(component.dropdownSelectionMode).toBe(
      DropdownDefaultSelectionMode.CUSTOM
    );
  });

  it("should close the modal correctly and empty the form", () => {
    const spy = jest.spyOn(component.modalOpenChange, "emit");

    component.ngOnInit();
    const formSpy = jest.spyOn(component.technicalReseedLaunchForm, "reset");

    component.closeModal();
    expect(component.modalOpen).toBe(false);
    expect(spy).toHaveBeenCalled();
    expect(component.technicalReseedLaunchForm.untouched).toBe(true);
    expect(formSpy).toHaveBeenCalled();
  });

  it("should clear selected final product on close", () => {
    const spy = jest.spyOn(
      component.finalProductDropdownComponent,
      "clearSelectedOption"
    );
    component.ngOnInit();
    component.closeModal();
    expect(spy).toHaveBeenCalled();
  });

  it("should update the final product form value correctly on change", () => {
    component.ngOnInit();
    component.handleSelectedFinalProduct(getFinalProduct());
    expect(component.technicalReseedLaunchForm.value?.finalProduct).toBe("id");
  });

  it("should update the final product branch correctly on change", () => {
    component.ngOnInit();
    component.handleSelectedFinalProduct(getFinalProduct());
    expect(component.selectedFinalProduct.branch).toBe("branch");
  });

  it("should update the final product commit correctly on change", () => {
    component.ngOnInit();
    component.handleSelectedFinalProduct(getFinalProduct());
    expect(component.selectedFinalProduct.configurationCommitId).toBe(
      "commitId"
    );
  });

  it("should update the validation level form value correctly on change", () => {
    component.ngOnInit();
    component.handleSelectedFinalProduct(getFinalProduct());
    expect(component.selectedFinalProduct.validationLevel).toBe(
      "validationLevel"
    );
  });

  it("should launch technical reseed operation correctly", () => {
    component.ngOnInit();
    component.technicalReseedLaunchForm.patchValue(getValidForm());
    component.handleSelectedFinalProduct(getFinalProduct());
    component.onSubmit();
    expect(technicalReseedService.launchTechnicalReseed).toHaveBeenCalledWith(
      PROJECT_ID,
      EXECUTION_GROUP_ID,
      getRequest()
    );
  });

  it("should emit the correct event when launching the reseed is successful", () => {
    const spy = jest.spyOn(component.operationLaunched, "emit");
    component.ngOnInit();
    component.technicalReseedLaunchForm.patchValue(getValidForm());
    component.handleSelectedFinalProduct(getFinalProduct());
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
  });

  it("should return an error in case the service fails", () => {
    const spy = jest.spyOn(component.operationLaunched, "emit");
    const errorMessage = "Failure message";
    jest
      .spyOn(technicalReseedService, "launchTechnicalReseed")
      .mockReturnValue(throwError(() => new Error(errorMessage)));
    component.ngOnInit();
    component.technicalReseedLaunchForm.patchValue(getValidForm());
    component.handleSelectedFinalProduct(getFinalProduct());
    component.onSubmit();

    expect(spy).toHaveBeenCalledWith({
      error: errorMessage,
      summary: "Failed to launch technical reseed operation",
    });
  });

  it("should close the modal correctly upon submit", () => {
    const spy = jest.spyOn(component.modalOpenChange, "emit");

    component.ngOnInit();
    component.technicalReseedLaunchForm.patchValue(getValidForm());
    component.handleSelectedFinalProduct(getFinalProduct());
    component.onSubmit();

    expect(component.modalOpen).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it("should close the observable and subscribing to the technical reseed service when the component is destroyed", () => {
    const observable = interval(100).pipe(concatMap(() => of({})));
    const subject = new Subject();

    technicalReseedService.launchTechnicalReseed = jest
      .fn()
      .mockReturnValue(merge(subject, observable));

    component.ngOnInit();
    component.technicalReseedLaunchForm.patchValue(getValidForm());
    component.handleSelectedFinalProduct(getFinalProduct());
    component.onSubmit();
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  function getValidForm(): TechnicalReseedForm {
    return {
      finalProduct: "id",
      maintenanceConfiguration: { full: true },
      environmentDefinitionId: "definitionId",
    };
  }

  function getFinalProduct(): FinalProduct {
    return {
      id: "id",
      projectId: "projectId",
      branch: "branch",
      environmentDefinitionId: "definitionId",
      configurationCommitId: "commitId",
      validationLevel: "validationLevel",
      createdOn: "",
      isTools: [],
      mxBundles: [],
      state: "",
      syncRequests: [],
      clientConfigurations: [],
      repositoryId: "repositoryId",
      version: "version",
    };
  }

  function getRequest(): LaunchTechnicalReseedOperationRequest {
    return {
      branch: "branch",
      configurationCommitId: "commitId",
      environmentDefinitionId: "definitionId",
      infraGroupId: INFRA_GROUP,
      maintenanceConfiguration: {
        full: true,
      },
      targetBranch: TARGET_BRANCH,
      validationLevel: "validationLevel",
    };
  }

  function getResponse(): LaunchTechnicalReseedOperationResponse {
    return { requestId: "requestId" };
  }

  interface TechnicalReseedForm {
    finalProduct: string;
    environmentDefinitionId: string;
    maintenanceConfiguration: MaintenanceConfiguration;
  }
});
