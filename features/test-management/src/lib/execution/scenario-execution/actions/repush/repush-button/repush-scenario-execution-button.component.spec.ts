import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RepushScenarioExecutionButtonComponent } from "./repush-scenario-execution-button.component";
import {
  ScenarioExecutionGroupActionPermissionApiModel,
  ScenarioExecutionRepushFromFinalProductModalComponent,
  ScenarioExecutionRepushModalComponent,
  ScenarioExecutionRepushModalModule,
  ScenarioExecutionService,
  TestUnitModel,
} from "@mxflow/test-management/execution";
import { MenuItemCommandEvent } from "primeng/api";
import { of } from "rxjs";
import { MockComponents, MockModule, MockPipes } from "ng-mocks";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { DomTestUtils } from "@mxevolve/testing";
import { Button } from "primeng/button";
import { MenuModule } from "primeng/menu";
import { RepushTooltipEvaluatorPipe } from "../repush-evaluator-pipe/repush-tooltip-evaluator.pipe";
import { TooltipModule } from "primeng/tooltip";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

const EXECUTION_GROUP_ID = "group-1";
const SCENARIO_EXECUTION_ID = "scenario-1";
const KEPT_EXECUTION = true;
const INITIAL_FINAL_PRODUCT_ID = "final-1";
const BRANCH = "main";
const MX_BUILD_ID = "build-1";
const MX_VERSION = "1.0";
const PROJECT_ID = "project-1";
const FACTORY_PRODUCT_ID = "factory-1";

const REPUSHABLE = true;

function getTestUnit() {
  return {
    headScenarioExecution: {
      id: SCENARIO_EXECUTION_ID,
      mxVersion: MX_VERSION,
      mxBuildId: MX_BUILD_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
      keptExecution: KEPT_EXECUTION,
    },
    executionGroupId: EXECUTION_GROUP_ID,
    branch: BRANCH,
    repushable: REPUSHABLE,
  } as TestUnitModel;
}

describe("repush scenario execution button component", () => {
  let component: RepushScenarioExecutionButtonComponent;
  let fixture: ComponentFixture<RepushScenarioExecutionButtonComponent>;
  let scenarioExecutionService: jest.Mocked<ScenarioExecutionService>;
  let analyticsTrackerService: {
    trackOfficialRepush: jest.Mock;
    trackUnofficialRepush: jest.Mock;
    trackStandardRepush: jest.Mock;
  };

  beforeEach(async () => {
    scenarioExecutionService = {
      isRepushAllowed: jest.fn(),
    } as unknown as jest.Mocked<ScenarioExecutionService>;

    analyticsTrackerService = {
      trackOfficialRepush: jest.fn(),
      trackUnofficialRepush: jest.fn(),
      trackStandardRepush: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        RepushScenarioExecutionButtonComponent,
        MockComponents(ScenarioExecutionRepushFromFinalProductModalComponent),
        MockPipes(RepushTooltipEvaluatorPipe),
        MockModule(ScenarioExecutionRepushModalModule),
        Button,
        MenuModule,
        TooltipModule,
      ],
      providers: [
        provideNoopAnimations(),
        {
          provide: TestManagementAnalyticsTrackerService,
          useValue: analyticsTrackerService,
        },
      ],
    })
      .overrideComponent(RepushScenarioExecutionButtonComponent, {
        set: {
          providers: [
            {
              provide: ScenarioExecutionService,
              useValue: scenarioExecutionService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RepushScenarioExecutionButtonComponent);
    component = fixture.componentInstance;

    component.projectId = PROJECT_ID;
    component.testUnit = getTestUnit();

    scenarioExecutionService.isRepushAllowed.mockReturnValue(
      of({
        actionAllowed: true,
        warnings: [],
        rejectionReasons: [],
      } as unknown as ScenarioExecutionGroupActionPermissionApiModel)
    );
    component.ngOnInit();
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch the scenario execution group eligibility on init", () => {
    expect(scenarioExecutionService.isRepushAllowed).toHaveBeenCalledWith(
      PROJECT_ID,
      EXECUTION_GROUP_ID,
      SCENARIO_EXECUTION_ID
    );
  });

  it("should set the warning message if applicable", () => {
    const mockEligibility = {
      actionAllowed: true,
      warnings: ["WARNING_CODE_1"],
    } as unknown as ScenarioExecutionGroupActionPermissionApiModel;
    component.warningMessageMap = {
      WARNING_CODE_1: "This is a warning message",
    };
    scenarioExecutionService.isRepushAllowed.mockReturnValue(
      of(mockEligibility)
    );

    component.ngOnInit();

    expect(component["warningMessage"]).toBe("This is a warning message");
  });

  it("should keep the warning message empty if no warning is present", () => {
    expect(component["warningMessage"]).toBeUndefined();
  });

  it("should display repush options when the user click the repush button", () => {
    component.allowOfficialRepush = true;

    getRepushButtonHarness().click();
    expect(component.repushOptions.length).toBe(2);
  });

  it("should not display the repush options if official repush is not enabled", () => {
    component.allowOfficialRepush = false;
    const openModalSpy = jest.spyOn(
      component.repushFromFactoryProductModal,
      "openModal"
    );

    getRepushButtonHarness().click();

    expect(openModalSpy).toHaveBeenCalled();
    expect(component.repushOptions.length).toBe(0);
  });

  it("should track standard repush when user clicks repush and official repush is not enabled", () => {
    component.repushFromFactoryProductModal = {
      openModal: jest.fn(),
    } as unknown as ScenarioExecutionRepushModalComponent;
    component.allowOfficialRepush = false;

    getRepushButtonHarness().click();

    expect(analyticsTrackerService.trackStandardRepush).toHaveBeenCalled();
  });

  it("should open the unofficial repush modal when user clicks unofficial repush", () => {
    component.repushFromFactoryProductModal = {
      openModal: jest.fn(),
    } as unknown as ScenarioExecutionRepushModalComponent;
    component.allowOfficialRepush = true;
    component.initialFinalProductId = INITIAL_FINAL_PRODUCT_ID;

    getRepushButtonHarness().click();
    component.repushOptions[1].command?.({} as MenuItemCommandEvent);

    expect(
      component.repushFromFactoryProductModal.openModal
    ).toHaveBeenCalledWith({
      scenarioExecutionId: SCENARIO_EXECUTION_ID,
      factoryProductId: FACTORY_PRODUCT_ID,
      keptExecution: KEPT_EXECUTION,
      executionGroupId: EXECUTION_GROUP_ID,
    });
  });

  it("should open the unofficial repush modal when user clicks repush and official repush is not enabled", () => {
    component.repushFromFactoryProductModal = {
      openModal: jest.fn(),
    } as unknown as ScenarioExecutionRepushModalComponent;
    component.allowOfficialRepush = false;

    getRepushButtonHarness().click();
    expect(
      component.repushFromFactoryProductModal.openModal
    ).toHaveBeenCalled();
  });

  it("should open the official repush modal when user clicks official repush", () => {
    component.repushFromFinalProductModalComponent = {
      openModal: jest.fn(),
    } as unknown as ScenarioExecutionRepushFromFinalProductModalComponent;
    component.allowOfficialRepush = true;
    component.initialFinalProductId = INITIAL_FINAL_PRODUCT_ID;

    getRepushButtonHarness().click();
    component.repushOptions[0].command?.({} as MenuItemCommandEvent);

    expect(
      component.repushFromFinalProductModalComponent.openModal
    ).toHaveBeenCalledWith({
      branch: BRANCH,
      initialFinalProductId: INITIAL_FINAL_PRODUCT_ID,
      keptExecution: KEPT_EXECUTION,
      scenarioExecutionId: SCENARIO_EXECUTION_ID,
      executionGroupId: EXECUTION_GROUP_ID,
    });
  });

  it("should track official repush when user clicks official repush", () => {
    component.repushFromFinalProductModalComponent = {
      openModal: jest.fn(),
    } as unknown as ScenarioExecutionRepushFromFinalProductModalComponent;
    component.allowOfficialRepush = true;
    component.initialFinalProductId = INITIAL_FINAL_PRODUCT_ID;

    getRepushButtonHarness().click();
    component.repushOptions[0].command?.({} as MenuItemCommandEvent);

    expect(analyticsTrackerService.trackOfficialRepush).toHaveBeenCalled();
  });

  it("should track unofficial repush when user clicks unofficial repush", () => {
    component.repushFromFactoryProductModal = {
      openModal: jest.fn(),
    } as unknown as ScenarioExecutionRepushModalComponent;
    component.allowOfficialRepush = true;
    component.initialFinalProductId = INITIAL_FINAL_PRODUCT_ID;

    getRepushButtonHarness().click();
    component.repushOptions[1].command?.({} as MenuItemCommandEvent);

    expect(analyticsTrackerService.trackUnofficialRepush).toHaveBeenCalled();
  });

  it("should disable the button if scenario is part of an execution group and action is not allowed", () => {
    component.testUnit = getTestUnit();
    const mockEligibility = {
      actionAllowed: false,
      warnings: [],
    } as unknown as ScenarioExecutionGroupActionPermissionApiModel;
    component.executionGroupScenarioRepushEligibility.set(
      SCENARIO_EXECUTION_ID,
      mockEligibility
    );
    scenarioExecutionService.isRepushAllowed.mockReturnValue(
      of(mockEligibility)
    );

    fixture.detectChanges();

    expect(getRepushButtonHarness().isDisabled()).toBe(true);
  });

  it("should enable the button if scenario is part of an execution group and action is allowed", () => {
    component.testUnit = getTestUnit();
    const mockEligibility = {
      actionAllowed: true,
      warnings: [],
    } as unknown as ScenarioExecutionGroupActionPermissionApiModel;
    component.executionGroupScenarioRepushEligibility.set(
      SCENARIO_EXECUTION_ID,
      mockEligibility
    );
    scenarioExecutionService.isRepushAllowed.mockReturnValue(
      of(mockEligibility)
    );

    fixture.detectChanges();

    expect(getRepushButtonHarness().isDisabled()).toBe(false);
  });

  it("should disable the button if scenario is not part of an execution group and is not repushable", () => {
    component.testUnit = {
      ...getTestUnit(),
      executionGroupId: undefined,
      repushable: false,
    };

    fixture.detectChanges();

    expect(getRepushButtonHarness().isDisabled()).toBe(true);
  });

  it("should enable the button if scenario is not part of an execution group and is repushable", () => {
    component.testUnit = {
      ...getTestUnit(),
      executionGroupId: undefined,
      repushable: true,
    };

    fixture.detectChanges();

    expect(getRepushButtonHarness().isDisabled()).toBe(false);
  });

  function getRepushButtonHarness() {
    return DomTestUtils.getButtonByTestId(fixture, "repush-button");
  }
});
