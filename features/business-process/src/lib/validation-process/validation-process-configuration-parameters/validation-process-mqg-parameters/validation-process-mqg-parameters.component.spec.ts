import { FormControl } from "@angular/forms";
import { ValidationProcessMqgParametersComponent } from "./validation-process-mqg-parameters.component";
import { fakeAsync, tick } from "@angular/core/testing";
import { concatMap, interval, merge, Observable, of, Subject } from "rxjs";

describe("Validation process MQG parameters", () => {
  let component: ValidationProcessMqgParametersComponent;

  beforeEach(() => {
    component = new ValidationProcessMqgParametersComponent();

    component.createBranchFormControl = new FormControl();
    component.createBranchFormControl.disable();
  });

  describe("Upon initialization", () => {
    it("should enable branch creation", () => {
      component.ngOnInit();

      expect(component.createBranchFormControl.enabled).toBeTruthy();
    });
  });

  describe("When create branch is preselected", () => {
    beforeEach(() => {
      component.createBranchFormControl.setValue(true);
    });

    it("should emit that create branch is selected", fakeAsync(() => {
      component.ngOnInit();

      let isCreateBranchSelected = false;
      component.isCreateBranchSelected$.subscribe(
        (actualValue) => (isCreateBranchSelected = actualValue)
      );

      tick();

      expect(isCreateBranchSelected).toBeTruthy();
    }));

    it("should be backward compatible with definitions that are saving create branch as a string", fakeAsync(() => {
      component.createBranchFormControl.setValue("true");

      component.ngOnInit();

      let isCreateBranchSelected = false;
      component.isCreateBranchSelected$.subscribe(
        (actualValue) => (isCreateBranchSelected = actualValue)
      );

      tick();

      expect(isCreateBranchSelected).toBeTruthy();
    }));
  });

  describe("When create branch is not preselected", () => {
    it("should emit that create branch is not selected", fakeAsync(() => {
      component.ngOnInit();

      let isCreateBranchSelected = true;
      component.isCreateBranchSelected$.subscribe(
        (actualValue) => (isCreateBranchSelected = actualValue)
      );

      tick();

      expect(isCreateBranchSelected).toBeFalsy();
    }));
  });

  describe("When create branch is selected", () => {
    it("should emit that create branch is selected", fakeAsync(() => {
      component.ngOnInit();

      let isCreateBranchSelected = false;
      component.isCreateBranchSelected$.subscribe(
        (actualValue) => (isCreateBranchSelected = actualValue)
      );

      component.createBranchFormControl.setValue(true);
      tick();

      expect(isCreateBranchSelected).toBeTruthy();
    }));
  });

  describe("When create branch is cleared", () => {
    beforeEach(() => {
      component.createBranchFormControl.setValue(true);
    });

    it("should emit that create branch is not selected", fakeAsync(() => {
      component.ngOnInit();

      let isCreateBranchSelected = true;
      component.isCreateBranchSelected$.subscribe(
        (actualValue) => (isCreateBranchSelected = actualValue)
      );
      component.createBranchFormControl.setValue(undefined);
      tick();

      expect(isCreateBranchSelected).toBeFalsy();
    }));
  });

  describe("When use existing branch is preselected", () => {
    beforeEach(() => {
      component.createBranchFormControl.setValue(false);
    });

    it("should emit that use existing branch is selected", fakeAsync(() => {
      component.ngOnInit();

      let isUseExistingBranchSelected = false;
      component.isUseExistingBranchSelected$.subscribe(
        (actualValue) => (isUseExistingBranchSelected = actualValue)
      );

      tick();

      expect(isUseExistingBranchSelected).toBeTruthy();
    }));

    it("When user selects using an existing branch it should announce that use existing branch is selected", fakeAsync(() => {
      component.createBranchFormControl.setValue("false");

      component.ngOnInit();

      let isUseExistingBranchSelected = false;
      component.isUseExistingBranchSelected$.subscribe(
        (actualValue) => (isUseExistingBranchSelected = actualValue)
      );

      tick();

      expect(isUseExistingBranchSelected).toBeTruthy();
    }));
  });

  describe("When use existing branch is not preselected", () => {
    it("should emit that use existing branch  is not selected", fakeAsync(() => {
      component.ngOnInit();

      let isUseExistingBranchSelected = true;
      component.isUseExistingBranchSelected$.subscribe(
        (actualValue) => (isUseExistingBranchSelected = actualValue)
      );

      tick();

      expect(isUseExistingBranchSelected).toBeFalsy();
    }));
  });

  describe("When use existing branch is selected", () => {
    it("should emit that use existing branch is selected", fakeAsync(() => {
      component.ngOnInit();

      let isUseExistingBranchSelected = false;
      component.isUseExistingBranchSelected$.subscribe(
        (actualValue) => (isUseExistingBranchSelected = actualValue)
      );

      component.createBranchFormControl.setValue(false);
      tick();

      expect(isUseExistingBranchSelected).toBeTruthy();
    }));
  });

  describe("When use existing branch is cleared", () => {
    beforeEach(() => {
      component.createBranchFormControl.setValue(false);
    });

    it("should emit that use existing branch  is not selected", fakeAsync(() => {
      component.ngOnInit();

      let isUseExistingBranchSelected = true;
      component.isUseExistingBranchSelected$.subscribe(
        (actualValue) => (isUseExistingBranchSelected = actualValue)
      );
      component.createBranchFormControl.setValue(undefined);
      tick();

      expect(isUseExistingBranchSelected).toBeFalsy();
    }));
  });

  describe("When switching from create branch to use existing branch", () => {
    beforeEach(() => {
      component.createBranchFormControl.setValue(true);
    });

    it("should emit that use existing branch  is selected", fakeAsync(() => {
      component.ngOnInit();

      let isUseExistingBranchSelected = false;
      component.isUseExistingBranchSelected$.subscribe(
        (actualValue) => (isUseExistingBranchSelected = actualValue)
      );
      component.createBranchFormControl.setValue(false);
      tick();

      expect(isUseExistingBranchSelected).toBeTruthy();
    }));

    it("should emit that create branch is not selected", fakeAsync(() => {
      component.ngOnInit();

      let isCreateNewBranch = true;
      component.isCreateBranchSelected$.subscribe(
        (actualValue) => (isCreateNewBranch = actualValue)
      );
      component.createBranchFormControl.setValue(false);
      tick();

      expect(isCreateNewBranch).toBeFalsy();
    }));
  });

  describe("When switching from use existing branch to create new branch", () => {
    beforeEach(() => {
      component.createBranchFormControl.setValue(false);
    });

    it("should emit that use existing branch  is not selected", fakeAsync(() => {
      component.ngOnInit();

      let isUseExistingBranchSelected = true;
      component.isUseExistingBranchSelected$.subscribe(
        (actualValue) => (isUseExistingBranchSelected = actualValue)
      );
      component.createBranchFormControl.setValue(true);
      tick();

      expect(isUseExistingBranchSelected).toBeFalsy();
    }));

    it("should emit that create branch is selected", fakeAsync(() => {
      component.ngOnInit();

      let isCreateNewBranch = false;
      component.isCreateBranchSelected$.subscribe(
        (actualValue) => (isCreateNewBranch = actualValue)
      );
      component.createBranchFormControl.setValue(true);
      tick();

      expect(isCreateNewBranch).toBeTruthy();
    }));
  });

  describe("Upon destruction", () => {
    it("should clear the selected create branch value", fakeAsync(() => {
      component.ngOnInit();

      component.createBranchFormControl.setValue(true);

      component.ngOnDestroy();
      tick();

      expect(component.createBranchFormControl.value).toEqual(undefined);
    }));

    it("should disable create branch selection", fakeAsync(() => {
      component.ngOnInit();

      component.createBranchFormControl.setValue(true);

      component.ngOnDestroy();
      tick();

      expect(component.createBranchFormControl.enabled).toBeFalsy();
    }));

    it("should end all subscriptions to the create branch form control", () => {
      const observable = interval(100).pipe(concatMap(() => of("value")));
      const subject = new Subject();

      const createBranchValueChanges = merge(
        subject,
        observable
      ) as Observable<string>;

      component.createBranchFormControl = {
        valueChanges: createBranchValueChanges,
        enable: jest.fn(),
        disable: jest.fn(),
        value: "value",
        setValue: jest.fn(),
      } as unknown as FormControl;

      component.ngOnInit();

      component.ngOnDestroy();

      expect(subject.observed).toBe(false);
    });
  });
  describe("Force showing fields", () => {
    it("should force show create branch if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["createBranch"];
      component.ngOnInit();
      expect(component.forceShowCreateBranch).toBeTruthy();
    });
    it("should not force show create branch if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowCreateBranch).toBeFalsy();
    });
  });
});
