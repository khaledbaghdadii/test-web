import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BuildAndTestConfigurationParamsInputsComponent } from "./build-and-test-configuration-params-inputs.component";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ToastMessageService } from "@mxflow/ui/alert";
import { InputAccessMode } from "../../definition-input/input-access-mode";
import { DisplayMode } from "../../definition-input/display-mode";
import { DefinitionInputComponent } from "../../definition-input/definition-input.component";
import { BranchInputComponent } from "@mxflow/features/scm";
import { BusinessProcessRepositorySelectorComponent } from "@mxflow/ui/inputs";

describe("BuildAndTestConfigurationParamsInputsComponent", () => {
  let component: BuildAndTestConfigurationParamsInputsComponent;
  let fixture: ComponentFixture<BuildAndTestConfigurationParamsInputsComponent>;
  let toastService: Partial<ToastMessageService>;

  beforeEach(() => {
    toastService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BuildAndTestConfigurationParamsInputsComponent],
      providers: [{ provide: ToastMessageService, useValue: toastService }],
    }).overrideComponent(BuildAndTestConfigurationParamsInputsComponent, {
      add: {
        imports: [
          MockDefinitionInputComponent,
          MockBranchInputComponent,
          MockBusinessProcessRepositorySelectorComponent,
        ],
      },
      remove: {
        imports: [
          DefinitionInputComponent,
          BranchInputComponent,
          BusinessProcessRepositorySelectorComponent,
        ],
      },
    });

    fixture = TestBed.createComponent(
      BuildAndTestConfigurationParamsInputsComponent
    );
    component = fixture.componentInstance;

    component.repositoryIdFormControl = new FormControl("repositoryId");
    component.configurationBranchNameFormControl = new FormControl(
      "configBranch"
    );
    component.configurationParentBranchFormControl = new FormControl(
      "parentBranch"
    );
    component.projectId = "projectId";
  });

  it("given the repository id input has no value the dependent configuration branch inputs should not be visible", () => {
    component.repositoryIdFormControl.setValue(undefined);

    fixture.detectChanges();

    expect(
      fixture.debugElement.queryAll(By.css("mxevolve-branch-input")).length
    ).toBe(0);
  });

  it("given the user changed the repository id input dependent configuration branch inputs are reset", () => {
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css("mxevolve-business-process-repository-selector"))
      .triggerEventHandler("repositoryChanged", "repo2");
    fixture.detectChanges();

    expect(component.configurationBranchNameFormControl.value).toBeNull();
    expect(component.configurationParentBranchFormControl.value).toBeNull();
  });

  it("the config branch input should be initialized with correct project id, repository id, form control, and initial value", () => {
    fixture.detectChanges();

    const archivalBranchInputComponent = fixture.debugElement.queryAll(
      By.css("mxevolve-branch-input")
    )[0].componentInstance as MockBranchInputComponent;

    expect(archivalBranchInputComponent.projectId).toBe("projectId");
    expect(archivalBranchInputComponent.repoId).toBe("repositoryId");
    expect(archivalBranchInputComponent.branchNameFormControl).toBe(
      component.configurationBranchNameFormControl
    );
    expect(archivalBranchInputComponent.initialValue).toBe("configBranch");
  });

  it("the archival branch input should validate that the provided branch does not exists", () => {
    fixture.detectChanges();

    const archivalBranchInputComponent = fixture.debugElement.queryAll(
      By.css("mxevolve-branch-input")
    )[0].componentInstance as MockBranchInputComponent;

    expect(archivalBranchInputComponent.branchShouldExist).toBe(false);
  });

  it("given the archival branch initial value is invalid, then show a toast message with an error", () => {
    fixture.detectChanges();

    const archivalBranchInputComponent = fixture.debugElement.queryAll(
      By.css("mxevolve-branch-input")
    )[0].componentInstance as MockBranchInputComponent;

    archivalBranchInputComponent.initialInvalid.emit();

    expect(toastService.showError).toHaveBeenCalledWith(
      "The branch name available in the BP definition or pre-filled in the pop-up already exists in the repository. Please update the definition or the pop-up with a unique name to create a new branch."
    );
  });

  it("the parent branch input should be initialized with correct project id, repository id, form control, and initial value", () => {
    fixture.detectChanges();

    const parentBranchInputComponent = fixture.debugElement.queryAll(
      By.css("mxevolve-branch-input")
    )[1].componentInstance as MockBranchInputComponent;

    expect(parentBranchInputComponent.projectId).toBe("projectId");
    expect(parentBranchInputComponent.repoId).toBe("repositoryId");
    expect(parentBranchInputComponent.branchNameFormControl).toBe(
      component.configurationParentBranchFormControl
    );
    expect(parentBranchInputComponent.initialValue).toBe("parentBranch");
  });

  it("the parent branch input should validate that the provided branch exists", () => {
    fixture.detectChanges();

    const parentBranchInputComponent = fixture.debugElement.queryAll(
      By.css("mxevolve-branch-input")
    )[1].componentInstance as MockBranchInputComponent;

    expect(parentBranchInputComponent.branchShouldExist).toBe(true);
  });

  it("given the parent branch initial value is invalid, then show a toast message with an error", () => {
    fixture.detectChanges();

    const parentBranchInputComponent = fixture.debugElement.queryAll(
      By.css("mxevolve-branch-input")
    )[1].componentInstance as MockBranchInputComponent;

    parentBranchInputComponent.initialInvalid.emit();

    expect(toastService.showError).toHaveBeenCalledWith(
      "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
    );
  });
});

@Component({
  selector: "mxevolve-definition-input",
  template: "<ng-content></ng-content>",
})
class MockDefinitionInputComponent {
  @Input({ required: true }) inputFormControlName: string;
  @Input({ required: true }) inputFormControl: FormControl;
  @Input() label: string;
  @Input({ required: true }) description: string;
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input({ required: true }) displayMode: DisplayMode;
  @Input() tooltip: string;
  @Input() forceShow = false;
  @Input() showValidationErrors = true;
}

@Component({
  selector: "mxevolve-branch-input",
  template: "",
})
class MockBranchInputComponent {
  @Input() branchShouldExist = true;
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) repoId!: string;
  @Input({ required: true }) branchNameFormControl!: FormControl;
  @Input() initialValue: string = "";
  @Output() initialInvalid = new EventEmitter<void>();
}

@Component({
  selector: "mxevolve-business-process-repository-selector",
  template: "",
})
class MockBusinessProcessRepositorySelectorComponent {
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) repositoryIdFormControl!: FormControl;
  @Input() inputAccessMode: InputAccessMode = InputAccessMode.ACCESS_ALL_INPUTS;
  @Input() displayMode: DisplayMode = DisplayMode.FULL_PAGE;
  @Input() forceShowRepositoryId: boolean = false;
  @Output() repositoryChanged = new EventEmitter<string>();
}
