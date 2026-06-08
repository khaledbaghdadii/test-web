import { FormControl } from "@angular/forms";
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
import { DqgFromNewBranchParametersComponent } from "./dqg-from-new-branch-parameters.component";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { InputAccessMode } from "../../../../definition-input/input-access-mode";
import { DisplayMode } from "../../../../definition-input/display-mode";
import { ToastMessageService } from "@mxflow/ui/alert";
import { DefinitionInputComponent } from "../../../../definition-input/definition-input.component";
import { BranchInputComponent } from "@mxflow/features/scm";
import { By } from "@angular/platform-browser";

describe("DQG from new branch parameters", () => {
  let toastService: Partial<ToastMessageService>;

  let fixture: ComponentFixture<DqgFromNewBranchParametersComponent>;
  let component: DqgFromNewBranchParametersComponent;

  beforeEach(() => {
    toastService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [DqgFromNewBranchParametersComponent],
      providers: [{ provide: ToastMessageService, useValue: toastService }],
    }).overrideComponent(DqgFromNewBranchParametersComponent, {
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

    fixture = TestBed.createComponent(DqgFromNewBranchParametersComponent);
    component = fixture.componentInstance;

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
    it("should enable archival branch name selection", () => {
      component.ngOnInit();

      expect(component.archivalBranchNameFormControl.enabled).toBeTruthy();
    });

    it("should enable final product selection", () => {
      component.ngOnInit();

      expect(component.finalProductIdFromControl.enabled).toBeTruthy();
    });
  });

  describe("Archival branch input validation", () => {
    it("the archival branch input should be initialized with correct project id, repository id, form control, and initial value", () => {
      component.projectId = "projectId";
      component.repositoryIdFormControl.setValue("repositoryId");
      component.archivalBranchNameFormControl.setValue("archivalBranch");

      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.query(
        By.css("mxevolve-branch-input")
      ).componentInstance as MockBranchInputComponent;

      expect(archivalBranchInputComponent.projectId).toBe("projectId");
      expect(archivalBranchInputComponent.repoId).toBe("repositoryId");
      expect(archivalBranchInputComponent.branchNameFormControl).toBe(
        component.archivalBranchNameFormControl
      );
      expect(archivalBranchInputComponent.initialValue).toBe("archivalBranch");
    });

    it("the archival branch input should validate that the provided branch does not exists", () => {
      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.query(
        By.css("mxevolve-branch-input")
      ).componentInstance as MockBranchInputComponent;

      expect(archivalBranchInputComponent.branchShouldExist).toBe(false);
    });

    it("given the archival branch initial value is invalid, then show a toast message with an error", () => {
      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.query(
        By.css("mxevolve-branch-input")
      ).componentInstance as MockBranchInputComponent;

      archivalBranchInputComponent.initialInvalid.emit();

      expect(toastService.showError).toHaveBeenCalledWith(
        "The branch name available in the BP definition already exists in the repository. Please update the definition with a unique name to create a new branch."
      );
    });
  });

  describe("Final product is preselected", () => {
    beforeEach(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
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
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
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
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
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
    it("should disable final product selection", fakeAsync(() => {
      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
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
