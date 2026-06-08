import { MqgFromNewBranchParametersComponent } from "./mqg-from-new-branch-parameters.component";
import { FormControl, Validators } from "@angular/forms";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import {
  BusinessProcessFinalProductInput,
  BusinessProcessFinalProductSelectorComponent,
} from "@mxflow/ui/inputs";
import { concatMap, interval, merge, Observable, of, Subject } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DefinitionInputComponent } from "../../../../definition-input/definition-input.component";
import { BranchInputComponent } from "@mxflow/features/scm";
import { By } from "@angular/platform-browser";
import { DisplayMode } from "../../../../definition-input/display-mode";
import { InputAccessMode } from "../../../../definition-input/input-access-mode";

describe("MQG from new branch parameters", () => {
  let toastService: Partial<ToastMessageService>;

  let fixture: ComponentFixture<MqgFromNewBranchParametersComponent>;
  let component: MqgFromNewBranchParametersComponent;

  beforeEach(() => {
    toastService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [MqgFromNewBranchParametersComponent],
      providers: [{ provide: ToastMessageService, useValue: toastService }],
    }).overrideComponent(MqgFromNewBranchParametersComponent, {
      remove: {
        imports: [
          DefinitionInputComponent,
          BranchInputComponent,
          BusinessProcessFinalProductSelectorComponent,
        ],
      },
      add: {
        imports: [
          MockDefinitionInputComponent,
          MockBranchInputComponent,
          MockBusinessProcessFinalProductSelectorComponent,
        ],
      },
    });

    fixture = TestBed.createComponent(MqgFromNewBranchParametersComponent);
    component = fixture.componentInstance;

    component.parentBranchFormControl = new FormControl();
    component.parentBranchFormControl.disable();
    component.archivalBranchNameFormControl = new FormControl();
    component.archivalBranchNameFormControl.disable();
    component.finalProductIdFromControl = new FormControl();
    component.finalProductIdFromControl.disable();
    component.rtpCommitIdFromControl = new FormControl();
    component.rtpCommitIdFromControl.disable();
    component.configCommitIdFromControl = new FormControl();
    component.configCommitIdFromControl.disable();
    component.repositoryIdFormControl = new FormControl();
  });

  describe("Upon initialization", () => {
    it("should mark parent branch input as required when final product input is required", () => {
      component.finalProductIdFromControl.setValidators([Validators.required]);

      component.ngOnInit();

      expect(
        component.parentBranchFormControl.hasValidator(Validators.required)
      ).toBeTruthy();
    });

    it("should mark parent branch input as not required when final product input is not required", () => {
      component.ngOnInit();

      expect(
        component.parentBranchFormControl.hasValidator(Validators.required)
      ).toBeFalsy();
    });

    it("should enable parent branch name selection", () => {
      component.ngOnInit();

      expect(component.parentBranchFormControl.enabled).toBeTruthy();
    });

    it("should enable archival branch name selection", () => {
      component.ngOnInit();

      expect(component.archivalBranchNameFormControl.enabled).toBeTruthy();
    });
  });

  describe("Parent branch input validation", () => {
    it("the parent branch input should be initialized with correct project id, repository id, form control, and initial value", () => {
      component.projectId = "projectId";
      component.repositoryIdFormControl.setValue("repositoryId");
      component.parentBranchFormControl.setValue("parentBranch");

      fixture.detectChanges();

      const parentBranchInputComponent = fixture.debugElement.queryAll(
        By.css("mxevolve-branch-input")
      )[0].componentInstance as MockBranchInputComponent;

      expect(parentBranchInputComponent.projectId).toBe("projectId");
      expect(parentBranchInputComponent.repoId).toBe("repositoryId");
      expect(parentBranchInputComponent.branchNameFormControl).toBe(
        component.parentBranchFormControl
      );
      expect(parentBranchInputComponent.initialValue).toBe("parentBranch");
    });

    it("the parent branch input should validate that the provided branch exists", () => {
      fixture.detectChanges();

      const parentBranchInputComponent = fixture.debugElement.queryAll(
        By.css("mxevolve-branch-input")
      )[0].componentInstance as MockBranchInputComponent;

      expect(parentBranchInputComponent.branchShouldExist).toBe(true);
    });

    it("given the parent branch initial value is invalid, then show a toast message with an error", () => {
      fixture.detectChanges();

      const parentBranchInputComponent = fixture.debugElement.queryAll(
        By.css("mxevolve-branch-input")
      )[0].componentInstance as MockBranchInputComponent;

      parentBranchInputComponent.initialInvalid.emit();

      expect(toastService.showError).toHaveBeenCalledWith(
        "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
      );
    });
  });

  describe("Archival branch input validation", () => {
    it("the archival branch input should be initialized with correct project id, repository id, form control, and initial value", () => {
      component.projectId = "projectId";
      component.repositoryIdFormControl.setValue("repositoryId");
      component.archivalBranchNameFormControl.setValue("archivalBranch");

      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.queryAll(
        By.css("mxevolve-branch-input")
      )[1].componentInstance as MockBranchInputComponent;

      expect(archivalBranchInputComponent.projectId).toBe("projectId");
      expect(archivalBranchInputComponent.repoId).toBe("repositoryId");
      expect(archivalBranchInputComponent.branchNameFormControl).toBe(
        component.archivalBranchNameFormControl
      );
      expect(archivalBranchInputComponent.initialValue).toBe("archivalBranch");
    });

    it("the archival branch input should validate that the provided branch does not exists", () => {
      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.queryAll(
        By.css("mxevolve-branch-input")
      )[1].componentInstance as MockBranchInputComponent;

      expect(archivalBranchInputComponent.branchShouldExist).toBe(false);
    });

    it("given the archival branch initial value is invalid, then show a toast message with an error", () => {
      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.queryAll(
        By.css("mxevolve-branch-input")
      )[1].componentInstance as MockBranchInputComponent;

      archivalBranchInputComponent.initialInvalid.emit();

      expect(toastService.showError).toHaveBeenCalledWith(
        "The branch name available in the BP definition already exists in the repository. Please update the definition with a unique name to create a new branch."
      );
    });
  });

  describe("Parent branch name is not preselected", () => {
    it("should disable final product selection", () => {
      component.ngOnInit();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    });

    it("should clear final product preselected value", () => {
      component.finalProductIdFromControl.setValue("finalProductId");

      component.ngOnInit();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    });

    it("should clear configuration commit id preselected value", () => {
      component.configCommitIdFromControl.setValue("configCommitId");

      component.ngOnInit();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    });

    it("should clear rtp commit id preselected value", () => {
      component.rtpCommitIdFromControl.setValue("rtpCommitId");

      component.ngOnInit();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    });
  });

  describe("Parent branch is preselected", () => {
    beforeEach(() => {
      component.parentBranchFormControl.setValue("parentBranch");
    });

    it("should enable final product selection", () => {
      component.ngOnInit();

      expect(component.finalProductIdFromControl.enabled).toBeTruthy();
    });
  });

  describe("Parent branch name is selected", () => {
    it("should enable final product id selection", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue("parentBranch");
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeTruthy();
    }));
  });

  describe("Parent branch is cleared", () => {
    beforeEach(() => {
      component.parentBranchFormControl.setValue("parentBranch");
      component.finalProductIdFromControl.setValue("finalProductId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
    });

    it("should disable final product selection", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue(undefined);
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("should clear the value of the selected final product id", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue(undefined);
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the value of the selected rtp commit id", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue(undefined);
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the value of the selected config commit id", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue(undefined);
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));
  });

  describe("Parent branch is changed", () => {
    beforeEach(() => {
      component.parentBranchFormControl.setValue("parentBranch");
      component.finalProductIdFromControl.setValue("finalProductId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
    });

    it("should clear the value of the selected final product id", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue("someotherparentbranch");
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the value of the selected rtp commit id", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue("someotherparentbranch");
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the value of the selected config commit id", fakeAsync(() => {
      component.ngOnInit();

      component.parentBranchFormControl.setValue("someotherparentbranch");
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));
  });

  describe("Final product is preselected", () => {
    beforeEach(() => {
      component.parentBranchFormControl.setValue("parentBranch");
      component.finalProductIdFromControl.setValue("finalProductId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
    });

    it("should set the value of the preselected final product id", () => {
      component.ngOnInit();

      expect(component.finalProductIdFromControl.value).toEqual(
        "finalProductId"
      );
    });

    it("should set the value of the preselected configuration commit id", () => {
      component.ngOnInit();

      expect(component.configCommitIdFromControl.value).toEqual(
        "configCommitId"
      );
    });

    it("should set the value of the preselected rtp commit id", () => {
      component.ngOnInit();

      expect(component.rtpCommitIdFromControl.value).toEqual("rtpCommitId");
    });

    it("should set the value of the preselected final product id in the temporary form control", () => {
      component.ngOnInit();

      expect(component.finalProductSelectionControl.value?.id).toEqual(
        "finalProductId"
      );
    });

    it("should set the value of the preselected configuration commit id in the temporary form control", () => {
      component.ngOnInit();

      expect(
        component.finalProductSelectionControl.value?.configurationCommitId
      ).toEqual("configCommitId");
    });

    it("should set the value of the preselected rtp commit id in the temporary form control", () => {
      component.ngOnInit();

      expect(component.finalProductSelectionControl.value?.rtpCommitId).toEqual(
        "rtpCommitId"
      );
    });
  });

  describe("Final product is selected", () => {
    beforeEach(() => {
      component.parentBranchFormControl.setValue("parentBranch");
    });

    it("should set the final product id", fakeAsync(() => {
      component.ngOnInit();

      component.finalProductSelectionControl.setValue({ id: "finalProductId" });
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(
        "finalProductId"
      );
    }));

    it("should set the configuration commit id", fakeAsync(() => {
      component.ngOnInit();

      component.finalProductSelectionControl.setValue({
        configurationCommitId: "configCommitId",
      });
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(
        "configCommitId"
      );
    }));

    it("should set the rtp commit id", fakeAsync(() => {
      component.ngOnInit();

      component.finalProductSelectionControl.setValue({
        rtpCommitId: "rtpCommitId",
      });
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual("rtpCommitId");
    }));
  });

  describe("Final product is cleared", () => {
    beforeEach(() => {
      component.parentBranchFormControl.setValue("parentBranch");
      component.finalProductIdFromControl.setValue("finalProductId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
    });

    it("should clear the final product id", fakeAsync(() => {
      component.ngOnInit();

      component.finalProductSelectionControl.setValue(
        undefined as unknown as BusinessProcessFinalProductInput
      );
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the configuration commit id", fakeAsync(() => {
      component.ngOnInit();

      component.finalProductSelectionControl.setValue(
        undefined as unknown as BusinessProcessFinalProductInput
      );
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the rtp commit id", fakeAsync(() => {
      component.ngOnInit();

      component.finalProductSelectionControl.setValue(
        undefined as unknown as BusinessProcessFinalProductInput
      );
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));
  });

  describe("Upon destruction", () => {
    it("should disable parent branch name selection", fakeAsync(() => {
      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.parentBranchFormControl.enabled).toBeFalsy();
    }));

    it("should disable final product selection", fakeAsync(() => {
      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("should clear parent branch preselected value", fakeAsync(() => {
      component.parentBranchFormControl.setValue("parentBranch");

      component.ngOnInit();
      component.ngOnDestroy();
      tick();

      expect(component.parentBranchFormControl.value).toEqual(undefined);
    }));

    it("should unmark parent branch selection as required", fakeAsync(() => {
      component.parentBranchFormControl.setValidators([Validators.required]);

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(
        component.parentBranchFormControl.hasValidator(Validators.required)
      ).toBeFalsy();
    }));

    it("should disable archival branch name selection", fakeAsync(() => {
      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.archivalBranchNameFormControl.enabled).toBeFalsy();
    }));

    it("should clear archival branch name preselected value", fakeAsync(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.archivalBranchNameFormControl.value).toEqual(undefined);
    }));

    it("should clear the final product id", fakeAsync(() => {
      component.finalProductIdFromControl.setValue("finalProductId");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the configuration commit id", fakeAsync(() => {
      component.configCommitIdFromControl.setValue("configCommitId");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the rtp commit id", fakeAsync(() => {
      component.rtpCommitIdFromControl.setValue("rtpCommitId");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should end all subscriptions to the parent branch name form control", () => {
      const observable = interval(100).pipe(concatMap(() => of("value")));
      const subject = new Subject();

      const parentBranchNamValueChanges = merge(
        subject,
        observable
      ) as Observable<string>;

      component.parentBranchFormControl = {
        valueChanges: parentBranchNamValueChanges,
        enable: jest.fn(),
        disable: jest.fn(),
        value: "value",
        setValue: jest.fn(),
        removeValidators: jest.fn(),
      } as unknown as FormControl;

      component.ngOnInit();

      expect(subject.observed).toBe(true);

      component.ngOnDestroy();

      expect(subject.observed).toBe(false);
    });
  });

  describe("Force showing fields", () => {
    it("should force show archival branch name if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["archivalBranchName"];
      component.ngOnInit();
      expect(component.forceShowArchivalBranch).toBeTruthy();
    });
    it("should not force show archival branch name if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowArchivalBranch).toBeFalsy();
    });
    it("should force show parent branch if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["parentBranch"];
      component.ngOnInit();
      expect(component.forceShowParentBranch).toBeTruthy();
    });
    it("should not force show parent branch if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowParentBranch).toBeFalsy();
    });
    it("should force show final product id if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["finalProductId"];
      component.ngOnInit();
      expect(component.forceShowFinalProductId).toBeTruthy();
    });
    it("should not force show final product id if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowFinalProductId).toBeFalsy();
    });
    it("should force show rtp commit id if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["rtpCommitId"];
      component.ngOnInit();
      expect(component.forceShowRtpCommitId).toBeTruthy();
    });
    it("should not force show rtp commit id if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowRtpCommitId).toBeFalsy();
    });
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
  selector: "mxevolve-business-process-final-product-selector",
  template: "",
})
class MockBusinessProcessFinalProductSelectorComponent {
  @Input({ required: true }) finalProductSelectionFormControl: FormControl<
    BusinessProcessFinalProductInput | undefined
  >;
  @Input({ required: true }) finalProductSelectionFormControlName: string;
  @Input({ required: true }) projectId: string;
  @Input() originBranchName: string;
  @Input() businessProcessQualityLevel: string;
  @Input() showAsTags: boolean;
}
