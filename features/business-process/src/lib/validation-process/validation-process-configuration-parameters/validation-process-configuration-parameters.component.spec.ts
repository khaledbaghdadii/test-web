import { ValidationProcessConfigurationParametersComponent } from "@mxflow/features/business-process";
import { FormControl } from "@angular/forms";
import { fakeAsync, tick } from "@angular/core/testing";
import { concatMap, interval, merge, Observable, of, Subject } from "rxjs";

describe("Business process definition inputs validation process definition inputs new validation process configuration parameters", () => {
  let component: ValidationProcessConfigurationParametersComponent;

  beforeEach(() => {
    component = new ValidationProcessConfigurationParametersComponent();

    component.repositoryIdFormControl = new FormControl();
    component.createBranchFormControl = new FormControl();
    component.businessProcessQualityLevelFormControl = new FormControl();
    component.archivalBranchNameFormControl = new FormControl();
    component.parentBranchFormControl = new FormControl();
    component.finalProductIdFromControl = new FormControl();
    component.rtpCommitIdFromControl = new FormControl();
    component.configCommitIdFromControl = new FormControl();
  });

  describe("When repository id is preselected", () => {
    it("should enable the quality gate level selection", () => {
      component.repositoryIdFormControl.setValue("repositoryId");

      component.ngOnInit();

      expect(
        component.businessProcessQualityLevelFormControl.enabled
      ).toBeTruthy();
    });
  });

  describe("When repository id is initially empty", () => {
    it("should disable the quality gate level selection", () => {
      component.ngOnInit();

      expect(
        component.businessProcessQualityLevelFormControl.disabled
      ).toBeTruthy();
    });

    it("should clear preselected quality level if initial state of the repository selection is empty", () => {
      component.businessProcessQualityLevelFormControl.setValue(
        "businessProcessQualityLevel"
      );

      component.ngOnInit();

      expect(component.businessProcessQualityLevelFormControl.value).toEqual(
        undefined
      );
    });
  });

  describe("When a repository id is selected", () => {
    it("should enable the quality level selection", fakeAsync(() => {
      component.ngOnInit();

      component.repositoryIdFormControl.setValue("repositoryId");
      tick();

      expect(
        component.businessProcessQualityLevelFormControl.enabled
      ).toBeTruthy();
    }));
  });

  describe("When repository id is cleared", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
      component.businessProcessQualityLevelFormControl.setValue("qualityLevel");
    });

    it("should disable the quality level selection", fakeAsync(() => {
      component.ngOnInit();

      component.repositoryIdFormControl.setValue(undefined);
      tick();

      expect(
        component.businessProcessQualityLevelFormControl.disabled
      ).toBeTruthy();
    }));

    it("should clear the quality level selection", fakeAsync(() => {
      component.ngOnInit();

      component.repositoryIdFormControl.setValue(undefined);
      tick();

      expect(component.businessProcessQualityLevelFormControl.value).toEqual(
        undefined
      );
    }));
  });

  describe("When MQG quality level is preselected", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
      component.businessProcessQualityLevelFormControl.setValue("MQG");
    });

    it("should emit that MQG is set", fakeAsync(() => {
      component.ngOnInit();

      let isMqgSet = false;
      component.isMQGQualityLevelSelected$.subscribe(
        (actualValue) => (isMqgSet = actualValue)
      );
      tick();

      expect(isMqgSet).toBeTruthy();
    }));
  });

  describe("When MQG quality level is not preselected", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
    });

    it("should emit that MQG is not set", fakeAsync(() => {
      component.ngOnInit();

      let isMqgSet = true;
      component.isMQGQualityLevelSelected$.subscribe(
        (actualValue) => (isMqgSet = actualValue)
      );

      tick();

      expect(isMqgSet).toBeFalsy();
    }));
  });

  describe("When MQG quality level is selected", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
    });

    it("should emit that MQG is set", fakeAsync(() => {
      component.ngOnInit();

      let isMqgSet = false;
      component.isMQGQualityLevelSelected$.subscribe(
        (actualValue) => (isMqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue("MQG");
      tick();

      expect(isMqgSet).toBeTruthy();
    }));
  });

  describe("When MQG quality level is cleared", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
      component.businessProcessQualityLevelFormControl.setValue("MQG");
    });

    it("should emit that MQG is not set", fakeAsync(() => {
      component.ngOnInit();

      let isMqgSet = true;
      component.isMQGQualityLevelSelected$.subscribe(
        (actualValue) => (isMqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue(undefined);
      tick();

      expect(isMqgSet).toBeFalsy();
    }));
  });

  describe("When DQG quality level is preselected", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
      component.businessProcessQualityLevelFormControl.setValue("DQG");
    });

    it("should emit that MQG is set", fakeAsync(() => {
      component.ngOnInit();

      let isDqgSet = false;
      component.isDQGQualityLevelSelected$.subscribe(
        (actualValue) => (isDqgSet = actualValue)
      );
      tick();

      expect(isDqgSet).toBeTruthy();
    }));
  });

  describe("When DQG quality level is not preselected", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
    });

    it("should emit that DQG is not set", fakeAsync(() => {
      component.ngOnInit();

      let isDqgSet = true;
      component.isDQGQualityLevelSelected$.subscribe(
        (actualValue) => (isDqgSet = actualValue)
      );

      tick();

      expect(isDqgSet).toBeFalsy();
    }));
  });

  describe("When DQG quality level is selected", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
    });

    it("should emit that DQG is set", fakeAsync(() => {
      component.ngOnInit();

      let isDqgSet = false;
      component.isDQGQualityLevelSelected$.subscribe(
        (actualValue) => (isDqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue("DQG");
      tick();

      expect(isDqgSet).toBeTruthy();
    }));
  });

  describe("When DQG quality level is cleared", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
      component.businessProcessQualityLevelFormControl.setValue("DQG");
    });

    it("should emit that DQG is not set", fakeAsync(() => {
      component.ngOnInit();

      let isDqgSet = true;
      component.isDQGQualityLevelSelected$.subscribe(
        (actualValue) => (isDqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue(undefined);
      tick();

      expect(isDqgSet).toBeFalsy();
    }));
  });

  describe("When switching from MQG quality level to DQG quality level", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
      component.businessProcessQualityLevelFormControl.setValue("MQG");
    });

    it("should emit that DQG is set", fakeAsync(() => {
      component.ngOnInit();

      let isDqgSet = false;
      component.isDQGQualityLevelSelected$.subscribe(
        (actualValue) => (isDqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue("DQG");
      tick();

      expect(isDqgSet).toBeTruthy();
    }));

    it("should emit that MQG is not set", fakeAsync(() => {
      component.ngOnInit();

      let isMqgSet = true;
      component.isMQGQualityLevelSelected$.subscribe(
        (actualValue) => (isMqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue("DQG");
      tick();

      expect(isMqgSet).toBeFalsy();
    }));
  });

  describe("When switching from DQG quality level to MQG quality level", () => {
    beforeEach(() => {
      component.repositoryIdFormControl.setValue("repositoryId");
      component.businessProcessQualityLevelFormControl.setValue("DQG");
    });

    it("should emit that DQG is not set", fakeAsync(() => {
      component.ngOnInit();

      let isDqgSet = true;
      component.isDQGQualityLevelSelected$.subscribe(
        (actualValue) => (isDqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue("MQG");
      tick();

      expect(isDqgSet).toBeFalsy();
    }));

    it("should emit that MQG is set", fakeAsync(() => {
      component.ngOnInit();

      let isMqgSet = false;
      component.isMQGQualityLevelSelected$.subscribe(
        (actualValue) => (isMqgSet = actualValue)
      );
      component.businessProcessQualityLevelFormControl.setValue("MQG");
      tick();

      expect(isMqgSet).toBeTruthy();
    }));
  });

  describe("Upon destruction", () => {
    it("should end all subscriptions to the repository selection form control", () => {
      const observable = interval(100).pipe(concatMap(() => of("value")));
      const subject = new Subject();

      const repositoryIdValueChanges = merge(
        subject,
        observable
      ) as Observable<string>;

      component.repositoryIdFormControl = {
        valueChanges: repositoryIdValueChanges,
      } as unknown as FormControl;

      component.ngOnInit();

      expect(subject.observed).toBe(true);

      component.ngOnDestroy();

      expect(subject.observed).toBe(false);
    });

    it("should end all subscriptions to the quality level selection form control", () => {
      const observable = interval(100).pipe(concatMap(() => of("value")));
      const subject = new Subject();

      const qualityLevelValueChanges = merge(
        subject,
        observable
      ) as Observable<string>;

      component.businessProcessQualityLevelFormControl = {
        valueChanges: qualityLevelValueChanges,
      } as unknown as FormControl;

      component.ngOnInit();

      component.ngOnDestroy();

      expect(subject.observed).toBe(false);
    });
  });
  describe("Force showing fields", () => {
    it("should force show repository id if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["repositoryId"];
      component.ngOnInit();
      expect(component.forceShowRepositoryId).toBeTruthy();
    });
    it("should not force show repository id if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowRepositoryId).toBeFalsy();
    });
    it("should force show quality gate level if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["businessProcessQualityLevel"];
      component.ngOnInit();
      expect(component.forceShowBusinessProcessQualityLevel).toBeTruthy();
    });
    it("should not force show quality gate level if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowBusinessProcessQualityLevel).toBeFalsy();
    });
  });
});
