import { AnalysisObjectUnlinkModalComponent } from "./analysis-object-unlink-modal.component";
import { delay, Observable, of, throwError } from "rxjs";
import { signal, WritableSignal } from "@angular/core";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { AnalysisObjectLink } from "../analysis-object-link";
import { ToastMessageService } from "@mxflow/ui/alert";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import { By } from "@angular/platform-browser";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { NgModel } from "@angular/forms";
import { PrimeTemplate } from "primeng/api";
import { AnalysisObjectLinkUtils } from "../analysis-object-link-utils";
import { ComponentFixture, fakeAsync, tick } from "@angular/core/testing";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { DomTestUtils } from "@mxevolve/testing";
import { Button } from "primeng/button";

describe("analysis object unlink modal", () => {
  const analysisObjectLinks: WritableSignal<AnalysisObjectLink[]> = signal([]);
  const testCaseExecutions: WritableSignal<TestCaseExecution[]> = signal([]);
  const testCaseExecutionsLoading: WritableSignal<boolean> = signal(false);

  let stateService: jest.Mocked<ScenarioExecutionStateManagementService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let analysisObjectLinkUtils: jest.Mocked<AnalysisObjectLinkUtils>;

  beforeEach(async () => {
    analysisObjectLinks.set([]);
    testCaseExecutions.set([]);

    stateService = {
      analysisObjectLinks: analysisObjectLinks,
      analyzableTestCaseExecutions: testCaseExecutions,
      testCaseExecutionsLoading: testCaseExecutionsLoading,
      updateAnalysisObjectsLinks: jest.fn(),
    } as unknown as jest.Mocked<ScenarioExecutionStateManagementService>;

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    analysisObjectLinkUtils = {
      getAnalysisObjectScenarioExecutionLink: jest.fn(() => undefined),
      getAnalysisObjectTestCaseExecutionLinks: jest.fn(() => []),
    } as unknown as jest.Mocked<AnalysisObjectLinkUtils>;

    await MockBuilder(AnalysisObjectUnlinkModalComponent)
      .keep(Button)
      .mock(ScenarioExecutionStateManagementService, stateService)
      .mock(ToastMessageService, toastMessageService)
      .mock(AnalysisObjectLinkUtils, analysisObjectLinkUtils)
      .mock(PrimeTemplate, { render: true });
  });

  it("should not be visible by default", () => {
    const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
    const modal = fixture.debugElement.query(By.css("p-dialog"));
    expect(modal.componentInstance.visible).toBeFalsy();
  });

  it("should be visible when visible input is true", () => {
    const componentInputs = { isVisible: true };
    const fixture = MockRender(
      AnalysisObjectUnlinkModalComponent,
      componentInputs
    );
    const modal = fixture.debugElement.query(By.css("p-dialog"));
    expect(modal.componentInstance.visible).toBeTruthy();
  });

  it.each([true, false])(
    "should bind modal's visibleChange output to the event emitter",
    (visibility) => {
      const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
      const component = fixture.point.componentInstance;
      const visibleChangeEmitter = jest.spyOn(
        component.isVisibleChange,
        "emit"
      );
      const modal = fixture.debugElement.query(By.css("p-dialog"));

      modal.componentInstance.visibleChange.emit(visibility);

      expect(visibleChangeEmitter).toHaveBeenCalledWith(visibility);
    }
  );

  it("should bind modal's onShow output to the method handling the logic upon opening the modal", () => {
    const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
    const component = fixture.point.componentInstance;
    const onOpenModalHandler = jest.spyOn(component, "onOpenModal");
    const modal = fixture.debugElement.query(By.css("p-dialog"));

    modal.componentInstance.onShow.emit();

    expect(onOpenModalHandler).toHaveBeenCalled();
  });

  it("should bind modal's onHide output to the method handling the logic upon closing the modal", () => {
    const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
    const component = fixture.point.componentInstance;
    const onCloseModalHandler = jest.spyOn(component, "onCloseModal");
    const modal = fixture.debugElement.query(By.css("p-dialog"));

    modal.componentInstance.onHide.emit();

    expect(onCloseModalHandler).toHaveBeenCalled();
  });

  it("should show a checkbox for unlinking scenario execution", () => {
    const fixture = openModalWithLinkToScenarioExecution();
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(
      By.css("#scenarioExecutionCheckbox")
    );
    expect(checkbox).toBeTruthy();
  });

  it("should not show a checkbox for unlinking scenario execution when there is no direct link to scenario execution", () => {
    analysisObjectLinks.set([]);
    const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(
      By.css("#scenarioExecutionCheckbox")
    );
    expect(checkbox).toBeFalsy();
  });

  it("should select the checkbox showing a link to scenario execution if there is one upon opening the modal", () => {
    const fixture = openModalWithLinkToScenarioExecution();
    const component = fixture.point.componentInstance;
    component.isScenarioExecutionSelected = false;

    component.onOpenModal();
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(
      By.css("#scenarioExecutionCheckbox")
    );
    const checkboxNgModel = checkbox.injector.get(NgModel);
    expect(checkboxNgModel.model).toBeTruthy();
  });

  it("should display test case executions linked to the analysis object", () => {
    const fixture = openModalWithLinkToTestCaseExecution();
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    fixture.detectChanges();

    const testCaseExecutionsSelection = fixture.debugElement.query(
      By.css("mxevolve-test-case-execution-selection-table")
    );
    expect(testCaseExecutionsSelection).toBeTruthy();
  });

  it("should not display test case executions if none are linked to the analysis object", () => {
    analysisObjectLinks.set([]);
    const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    fixture.detectChanges();

    const testCaseExecutionsSelection = fixture.debugElement.query(
      By.css("mxevolve-test-case-execution-selection-table")
    );
    expect(testCaseExecutionsSelection).toBeFalsy();
  });

  it("should pass test case executions linked to the analysis object to the test case execution selection component", () => {
    const fixture = openModalWithLinkToTestCaseExecution();
    const testCaseExecution = {
      id: "testCaseExecutionId",
    } as unknown as TestCaseExecution;
    testCaseExecutions.set([testCaseExecution]);
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    fixture.detectChanges();

    const testCaseExecutionsSelection = fixture.debugElement.query(
      By.css("mxevolve-test-case-execution-selection-table")
    );
    expect(
      testCaseExecutionsSelection.componentInstance.testCaseExecutions
    ).toEqual([testCaseExecution]);
  });

  it.each([true, false])(
    "should pass test case executions loading to selection component",
    (loadingValue) => {
      const fixture = openModalWithLinkToTestCaseExecution();
      const testCaseExecution = {
        id: "testCaseExecutionId",
      } as unknown as TestCaseExecution;
      testCaseExecutions.set([testCaseExecution]);
      testCaseExecutionsLoading.set(loadingValue);
      const component = fixture.point.componentInstance;

      component.onOpenModal();
      fixture.detectChanges();

      const testCaseExecutionsSelection = fixture.debugElement.query(
        By.css("mxevolve-test-case-execution-selection-table")
      );
      expect(testCaseExecutionsSelection.componentInstance.isLoading).toEqual(
        loadingValue
      );
    }
  );

  it("should not pass test case executions with no link to the analysis object to selection component", () => {
    const fixture = openModalWithLinkToTestCaseExecution();
    const testCaseExecution = {
      id: "testCaseExecutionId",
    } as unknown as TestCaseExecution;
    const testCaseExecution2 = {
      id: "testCaseExecutionId2",
    } as unknown as TestCaseExecution;
    testCaseExecutions.set([testCaseExecution, testCaseExecution2]);
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    fixture.detectChanges();

    const testCaseExecutionsSelection = fixture.debugElement.query(
      By.css("mxevolve-test-case-execution-selection-table")
    );
    expect(
      testCaseExecutionsSelection.componentInstance.testCaseExecutions
    ).toEqual([testCaseExecution]);
  });

  it("should pass all test case executions linked to analysis object as selected to the selection component", () => {
    const analysisObjectTestCaseExecutionLinks = [
      {
        analysisObjectId: "analysisObjectId",
        analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        testCaseExecutionId: "testCaseExecutionId1",
      },
      {
        analysisObjectId: "analysisObjectId",
        analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        testCaseExecutionId: "testCaseExecutionId2",
      },
    ];

    setAnalysisObjectTestCaseExecutionLinks(
      analysisObjectTestCaseExecutionLinks
    );

    const testCaseExecution1 = {
      id: "testCaseExecutionId1",
    } as unknown as TestCaseExecution;

    const testCaseExecution2 = {
      id: "testCaseExecutionId2",
    } as unknown as TestCaseExecution;

    testCaseExecutions.set([testCaseExecution1, testCaseExecution2]);
    const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    fixture.detectChanges();

    const testCaseExecutionsSelection = fixture.debugElement.query(
      By.css("mxevolve-test-case-execution-selection-table")
    );
    expect(
      testCaseExecutionsSelection.componentInstance.testCaseExecutionsSelection
    ).toEqual([testCaseExecution1, testCaseExecution2]);
  });

  it("should show success message if unlinking was successful", () => {
    const fixture = openModalWithLinkToScenarioExecution();
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    component.isScenarioExecutionSelected = false;
    stateService.updateAnalysisObjectsLinks.mockReturnValue(of(undefined));
    fixture.detectChanges();

    component.updateAnalysisObjectLinks();

    expect(jest.spyOn(toastMessageService, "showSuccess")).toHaveBeenCalled();
  });

  it("should show error message if unlinking failed", () => {
    const fixture = openModalWithLinkToScenarioExecution();
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    component.isScenarioExecutionSelected = false;
    stateService.updateAnalysisObjectsLinks.mockReturnValue(
      throwError(() => new Error("Unlinking failed"))
    );
    fixture.detectChanges();

    component.updateAnalysisObjectLinks();

    expect(jest.spyOn(toastMessageService, "showError")).toHaveBeenCalledWith(
      "Unlinking failed"
    );
  });

  describe("on close modal", () => {
    it("should reset isLinkedToScenarioExecution modal variable", () => {
      const fixture = openModalWithLinkToScenarioExecution();
      const component = fixture.point.componentInstance;
      component.isLinkedToScenarioExecution = true;

      component.onCloseModal();

      expect(component.isLinkedToScenarioExecution).toBeFalsy();
    });

    it("should reset isScenarioExecutionSelected modal variable", () => {
      const fixture = openModalWithLinkToScenarioExecution();
      const component = fixture.point.componentInstance;
      component.isScenarioExecutionSelected = false;

      component.onCloseModal();

      expect(component.isScenarioExecutionSelected).toBeTruthy();
    });

    it("should reset testCaseExecutionLinksToUnlink modal variable", () => {
      const fixture = openModalWithLinkToTestCaseExecution();
      const component = fixture.point.componentInstance;
      component.testCaseExecutionLinksToUnlink = [
        {
          analysisObjectId: "analysisObjectId",
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          projectId: "projectId",
          scenarioExecutionId: "scenarioExecutionId",
          testCaseExecutionId: "testCaseExecutionId",
        },
      ];

      component.onCloseModal();

      expect(component.testCaseExecutionLinksToUnlink).toEqual([]);
    });

    it("should reset isUpdatingLinksInProgress modal variable", () => {
      const fixture = openModalWithLinkToScenarioExecution();
      const component = fixture.point.componentInstance;
      component.isUpdatingLinksInProgress = true;

      component.onCloseModal();

      expect(component.isUpdatingLinksInProgress).toBeFalsy();
    });
  });

  describe.each([of(), throwError(() => new Error("error"))])(
    "post unlinking",
    (unlinkServiceMockResult) => {
      it("should close the modal after unlinking", () => {
        const fixture = openModalWithLinkToScenarioExecution();
        const component = fixture.point.componentInstance;

        performUnlinking(fixture, component);

        expect(component.isVisible).toBeFalsy();
      });

      it("should emit visibility change event when closing modal", () => {
        const fixture = openModalWithLinkToScenarioExecution();
        const component = fixture.point.componentInstance;
        const isVisibleChangeSpy = jest.spyOn(
          component.isVisibleChange,
          "emit"
        );

        performUnlinking(fixture, component);

        expect(isVisibleChangeSpy).toHaveBeenCalledWith(false);
      });

      it("should reset isLinkedToScenarioExecution modal variable", () => {
        const fixture = openModalWithLinkToScenarioExecution();
        const component = fixture.point.componentInstance;

        performUnlinking(fixture, component);

        expect(component.isLinkedToScenarioExecution).toBeFalsy();
      });

      it("should reset isScenarioExecutionSelected modal variable", () => {
        const fixture = openModalWithLinkToScenarioExecution();
        const component = fixture.point.componentInstance;

        performUnlinking(fixture, component);

        expect(component.isScenarioExecutionSelected).toBeTruthy();
      });

      it("should reset testCaseExecutionLinksToUnlink modal variable", () => {
        const fixture = openModalWithLinkToTestCaseExecution();
        const component = fixture.point.componentInstance;

        performUnlinking(fixture, component);

        expect(component.testCaseExecutionLinksToUnlink).toEqual([]);
      });

      function performUnlinking(
        fixture: MockedComponentFixture<AnalysisObjectUnlinkModalComponent>,
        component: AnalysisObjectUnlinkModalComponent
      ) {
        component.isVisible = true;
        component.onOpenModal();
        component.isScenarioExecutionSelected = false;
        component.onTestCaseExecutionsSelectionChange([]);
        stateService.updateAnalysisObjectsLinks.mockReturnValue(
          unlinkServiceMockResult
        );
        fixture.detectChanges();

        component.updateAnalysisObjectLinks();
      }
    }
  );

  function getUnlinkButtonHarness(fixture: ComponentFixture<unknown>) {
    return DomTestUtils.getButtonByTestId(fixture, "unlink-button");
  }

  describe("unlink button", () => {
    it("should not request to unlink scenario execution if there is no existing link", () => {
      analysisObjectLinks.set([]);
      const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
      const component = fixture.point.componentInstance;

      component.onOpenModal();
      getUnlinkButtonHarness(fixture).click();
      expect(stateService.updateAnalysisObjectsLinks).not.toHaveBeenCalled();
    });

    it("should not request to unlink scenario execution if it is still selected", () => {
      analysisObjectLinks.set([
        {
          analysisObjectId: "analysisObjectId",
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          projectId: "projectId",
          scenarioExecutionId: "scenarioExecutionId",
          testCaseExecutionId: undefined,
        },
      ]);
      const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
      const component = fixture.point.componentInstance;

      component.onOpenModal();
      component.isScenarioExecutionSelected = true;
      getUnlinkButtonHarness(fixture).click();
      expect(stateService.updateAnalysisObjectsLinks).not.toHaveBeenCalled();
    });

    it("should request to unlink from scenario execution when clicked and scenario execution link is no longer selected", () => {
      const analyisObjectScenarioExecutionLink = {
        analysisObjectId: "analysisObjectId",
        analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        testCaseExecutionId: undefined,
      };
      setAnalysisObjectScenarioExecutionLink(
        analyisObjectScenarioExecutionLink
      );

      const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
      const component = fixture.point.componentInstance;

      component.onOpenModal();
      component.isScenarioExecutionSelected = false;
      getUnlinkButtonHarness(fixture).click();
      const expectedUpdateLinksRequest = {
        linksToAdd: [],
        linksToRemove: [
          {
            testCaseExecutionId: undefined,
            analysisObjectId: "analysisObjectId",
            analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          },
        ],
      };
      expect(stateService.updateAnalysisObjectsLinks).toHaveBeenCalledWith(
        expectedUpdateLinksRequest
      );
    });

    it("should unlink test case execution link if no longer selected", () => {
      const fixture = openModalAndUnSelectAnalysisObjectTestCaseExecutionLink();

      getUnlinkButtonHarness(fixture).click();

      const expectedUpdateLinksRequest = {
        linksToAdd: [],
        linksToRemove: [
          {
            testCaseExecutionId: "testCaseExecutionId",
            analysisObjectId: "analysisObjectId",
            analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          },
        ],
      };
      expect(stateService.updateAnalysisObjectsLinks).toHaveBeenCalledWith(
        expectedUpdateLinksRequest
      );
    });

    it("should be disabled when nothing is unselected to unlink", () => {
      analysisObjectLinks.set([
        {
          analysisObjectId: "analysisObjectId",
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          projectId: "projectId",
          scenarioExecutionId: "scenarioExecutionId",
          testCaseExecutionId: undefined,
        },
        {
          analysisObjectId: "analysisObjectId",
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          projectId: "projectId",
          scenarioExecutionId: "scenarioExecutionId",
          testCaseExecutionId: "testCaseExecutionId",
        },
      ]);

      const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
      const component = fixture.point.componentInstance;

      component.onOpenModal();

      expect(getUnlinkButtonHarness(fixture).isDisabled()).toBeTruthy();
    });

    it("should be enabled if scenario execution is unselected to unlink", () => {
      analysisObjectLinks.set([
        {
          analysisObjectId: "analysisObjectId",
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          projectId: "projectId",
          scenarioExecutionId: "scenarioExecutionId",
          testCaseExecutionId: undefined,
        },
      ]);

      const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
      const component = fixture.point.componentInstance;

      component.onOpenModal();
      component.isScenarioExecutionSelected = false;

      expect(getUnlinkButtonHarness(fixture).isDisabled()).toBeFalsy();
    });

    it("should be enabled if a test case execution is unselected to unlink", () => {
      const fixture = openModalAndUnSelectAnalysisObjectTestCaseExecutionLink();
      fixture.detectChanges();

      expect(getUnlinkButtonHarness(fixture).isDisabled()).toBeFalsy();
    });

    it("should be loading when updating links is in progress", fakeAsync(() => {
      const fixture = openModalAndUnSelectAnalysisObjectTestCaseExecutionLink();
      const component = fixture.point.componentInstance;

      stateService.updateAnalysisObjectsLinks.mockReturnValue(
        of(undefined).pipe(delay(1000))
      );
      component.updateAnalysisObjectLinks();
      expect(getUnlinkButtonHarness(fixture).isLoading()).toBeTruthy();
    }));

    it("should not be loading when updating links is no longer in progress", fakeAsync(() => {
      const fixture = openModalAndUnSelectAnalysisObjectTestCaseExecutionLink();
      const component = fixture.point.componentInstance;

      stateService.updateAnalysisObjectsLinks.mockReturnValue(
        of(undefined).pipe(delay(1000))
      );
      component.updateAnalysisObjectLinks();

      tick(1500);
      expect(getUnlinkButtonHarness(fixture).isLoading()).toBeFalsy();
    }));
  });

  describe("update analysis object links", () => {
    it("should subscribe on observable returned from the state service", () => {
      const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
      const component = fixture.point.componentInstance;

      const mockObservable = new Observable<undefined>();
      const subscribeSpy = jest.spyOn(mockObservable, "subscribe");

      stateService.updateAnalysisObjectsLinks.mockReturnValue(mockObservable);

      const analysisObjectLinkScenarioExecutionLink = {
        analysisObjectId: "analysisObjectId",
        analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        testCaseExecutionId: undefined,
      };
      setAnalysisObjectScenarioExecutionLink(
        analysisObjectLinkScenarioExecutionLink
      );

      component.isScenarioExecutionSelected = false;

      component.updateAnalysisObjectLinks();

      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  function openModalWithLinkToScenarioExecution(): MockedComponentFixture<AnalysisObjectUnlinkModalComponent> {
    const analysisObjectScenarioExecutionLink = {
      analysisObjectId: "analysisObjectId",
      analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
      projectId: "projectId",
      scenarioExecutionId: "scenarioExecutionId",
      testCaseExecutionId: undefined,
    };

    setAnalysisObjectScenarioExecutionLink(analysisObjectScenarioExecutionLink);

    return MockRender(AnalysisObjectUnlinkModalComponent);
  }

  function openModalWithLinkToTestCaseExecution(): MockedComponentFixture<AnalysisObjectUnlinkModalComponent> {
    const analysisObjectTestCaseExecutionLinks = [
      {
        analysisObjectId: "analysisObjectId",
        analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        testCaseExecutionId: "testCaseExecutionId",
      },
    ];

    setAnalysisObjectTestCaseExecutionLinks(
      analysisObjectTestCaseExecutionLinks
    );

    return MockRender(AnalysisObjectUnlinkModalComponent);
  }

  function openModalAndUnSelectAnalysisObjectTestCaseExecutionLink(): MockedComponentFixture<AnalysisObjectUnlinkModalComponent> {
    const analysisObjectTestCaseExecutionLinks = [
      {
        analysisObjectId: "analysisObjectId",
        analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        testCaseExecutionId: "testCaseExecutionId",
      },
    ];
    setAnalysisObjectTestCaseExecutionLinks(
      analysisObjectTestCaseExecutionLinks
    );

    const fixture = MockRender(AnalysisObjectUnlinkModalComponent);
    const component = fixture.point.componentInstance;

    component.onOpenModal();
    component.onTestCaseExecutionsSelectionChange([]);

    return fixture;
  }

  function setAnalysisObjectScenarioExecutionLink(
    analysisObjectLinkScenarioExecutionLink: AnalysisObjectLink | undefined
  ) {
    if (analysisObjectLinkScenarioExecutionLink) {
      analysisObjectLinks.set([analysisObjectLinkScenarioExecutionLink]);
    } else {
      analysisObjectLinks.set([]);
    }

    analysisObjectLinkUtils.getAnalysisObjectScenarioExecutionLink.mockReturnValue(
      analysisObjectLinkScenarioExecutionLink
    );
  }

  function setAnalysisObjectTestCaseExecutionLinks(
    analysisObjectTestCaseExecutionLinks: AnalysisObjectLink[]
  ) {
    analysisObjectLinks.set(analysisObjectTestCaseExecutionLinks);
    analysisObjectLinkUtils.getAnalysisObjectTestCaseExecutionLinks.mockReturnValue(
      analysisObjectTestCaseExecutionLinks
    );
  }
});
