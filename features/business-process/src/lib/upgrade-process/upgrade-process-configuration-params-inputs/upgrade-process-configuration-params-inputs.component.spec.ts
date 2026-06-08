import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { UpgradeProcessConfigurationParamsInputsComponent } from "./upgrade-process-configuration-params-inputs.component";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("UpgradeProcessConfigurationParamsInputsComponent", () => {
  let component: UpgradeProcessConfigurationParamsInputsComponent;
  let fixture: ComponentFixture<UpgradeProcessConfigurationParamsInputsComponent>;
  let toastService: Partial<ToastMessageService>;

  beforeEach(async () => {
    toastService = {
      showError: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UpgradeProcessConfigurationParamsInputsComponent],
      providers: [{ provide: ToastMessageService, useValue: toastService }],
    })
      .overrideComponent(UpgradeProcessConfigurationParamsInputsComponent, {
        set: {
          imports: [],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(
      UpgradeProcessConfigurationParamsInputsComponent
    );
    component = fixture.componentInstance;
    component.repositoryIdFormControl = new FormControl();
    component.businessProcessQualityLevelFormControl = new FormControl();
    component.createBranchFormControl = new FormControl();
    component.configurationBranchNameFormControl = new FormControl();
    component.configurationParentBranchFormControl = new FormControl();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("show show the business process quality level input", () => {
    component.repositoryIdFormControl = new FormControl(null);
    component.businessProcessQualityLevelFormControl = new FormControl();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('p-select[id="businessProcessQualityLevel"]')
    ).not.toBeNull();
  });

  it("given the repository id has no value the dependent configuration branch inputs should not be visible", () => {
    component.repositoryIdFormControl = new FormControl(null);
    component.businessProcessQualityLevelFormControl = new FormControl("MQG");

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('input[formControlName="createBranch"]')
    ).toBeNull();
    expect(
      compiled.querySelector('input[formControlName="configurationBranchName"]')
    ).toBeNull();
    expect(
      compiled.querySelector(
        'input[formControlName="configurationParentBranch"]'
      )
    ).toBeNull();
  });

  it("should reset dependent inputs when repository is cleared", fakeAsync(() => {
    component.repositoryIdFormControl.setValue("repo1");
    component.businessProcessQualityLevelFormControl.setValue("MQG");
    component.createBranchFormControl.setValue(true);
    component.configurationBranchNameFormControl.setValue("feature/branch");
    component.configurationParentBranchFormControl.setValue("main");

    component.ngOnInit();

    component.repositoryIdFormControl.setValue(null);
    tick();

    expect(component.createBranchFormControl.value).toBeNull();
    expect(component.configurationBranchNameFormControl.value).toBeNull();
    expect(component.configurationParentBranchFormControl.value).toBeNull();
  }));

  it("should reset business process quality level when value is NA", fakeAsync(() => {
    component.businessProcessQualityLevelFormControl.setValue("NA");
    component.ngOnInit();

    expect(component.businessProcessQualityLevelFormControl.value).toBeNull();
  }));

  it("given the user changed the repository id input all dependent inputs  are reset", () => {
    component.repositoryIdFormControl = new FormControl("repo1");
    component.businessProcessQualityLevelFormControl = new FormControl("MQG");
    component.createBranchFormControl = new FormControl(true);
    component.configurationBranchNameFormControl = new FormControl(
      "feature/branch1"
    );
    component.configurationParentBranchFormControl = new FormControl("main");

    fixture.detectChanges();
    fixture.debugElement
      .query(By.css("mxevolve-business-process-repository-selector"))
      .triggerEventHandler("repositoryChanged", "repo2");
    fixture.detectChanges();

    expect(component.createBranchFormControl.value).toBeNull();
    expect(component.configurationBranchNameFormControl.value).toBeNull();
    expect(component.configurationParentBranchFormControl.value).toBeNull();
  });

  it("should notify user when trying to create a configuration branch that already exists and create branch is true", () => {
    component.createBranchFormControl = new FormControl(true);
    component.showConfigBranchError();

    expect(toastService.showError).toHaveBeenCalledWith(
      "The branch name available in the BP definition already exists in the repository. Please update the definition with a unique name to create a new branch."
    );
  });

  it("should notify user when trying to create a configuration branch that does not exist and create branch is false", () => {
    component.createBranchFormControl = new FormControl(false);
    component.showConfigBranchError();

    expect(toastService.showError).toHaveBeenCalledWith(
      "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  });

  it("should notify user when parent branch does not exist", () => {
    component.showParentBranchError();

    expect(toastService.showError).toHaveBeenCalledWith(
      "The branch name you entered doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  });

  it("should keep track of the initial configuration branch name value even after the user changes it", () => {
    const branchName = "feature/my-upgrade";
    component.configurationBranchNameFormControl = new FormControl(branchName);
    component.configurationParentBranchFormControl = new FormControl();

    component.ngOnInit();

    component.configurationBranchNameFormControl = new FormControl("main");

    expect(component.configurationBranchNameInitialValue).toBe(branchName);
  });

  it("should keep track of the initial parent configuration branch name value even after the user changes it", () => {
    const parentBranch = "main";
    component.configurationBranchNameFormControl = new FormControl();
    component.configurationParentBranchFormControl = new FormControl(
      parentBranch
    );

    component.ngOnInit();
    component.configurationParentBranchFormControl = new FormControl("develop");

    expect(component.parentBranchNameInitialValue).toBe(parentBranch);
  });

  it("should reset configuration branch name and parent configuration branch name inputs whenever create branch input changes", () => {
    component.repositoryIdFormControl = new FormControl("repo1");
    component.createBranchFormControl = new FormControl(true);

    component.ngOnInit();

    component.configurationBranchNameFormControl.setValue("branch1");
    component.configurationParentBranchFormControl.setValue("main");
    component.createBranchFormControl.setValue(false);

    expect(component.configurationBranchNameFormControl.value).toBeNull();
    expect(component.configurationParentBranchFormControl.value).toBeNull();

    component.configurationBranchNameFormControl.setValue("branch2");
    component.configurationParentBranchFormControl.setValue("develop");
    component.createBranchFormControl.setValue(true);

    expect(component.configurationBranchNameFormControl.value).toBeNull();
    expect(component.configurationParentBranchFormControl.value).toBeNull();
  });
});
