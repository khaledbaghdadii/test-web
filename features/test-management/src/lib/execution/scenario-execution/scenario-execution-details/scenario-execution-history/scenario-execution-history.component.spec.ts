import { ScenarioExecutionHistoryComponent } from "./scenario-execution-history.component";
import {
  ScenarioAnalysisStatus,
  ScenarioExecutionAnalysisObjectsModel,
  ScenarioExecutionEnvironmentModel,
  ScenarioExecutionStatus,
  TestUnitModel,
  TestUnitScenarioExecutionModel,
} from "@mxflow/test-management";
import { MockPipe, ngMocks } from "ng-mocks";
import {
  AuthenticationService,
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { By } from "@angular/platform-browser";
import { TableModule } from "primeng/table";
import {
  DebugElement,
  NO_ERRORS_SCHEMA,
  signal,
  WritableSignal,
} from "@angular/core";
import {
  CommitIdShortnerPipe,
  DurationFormatterPipe,
  DurationPipe,
} from "@mxflow/pipe";
import { DatePipe } from "@angular/common";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import {
  scenarioExecutionId,
  testUnitId1,
} from "../../scenario-execution-test-utils";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import { KeptExecutionDisabledPipe } from "../kept-execution-disabled/kept-execution-disabled.pipe";
import { of } from "rxjs";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { provideMockStore } from "@ngrx/store/testing";

describe("ScenarioExecutionHistoryComponent", () => {
  let component: ScenarioExecutionHistoryComponent;
  let fixture: ComponentFixture<ScenarioExecutionHistoryComponent>;
  let stateService: jest.Mocked<ScenarioExecutionStateManagementService>;

  const TEST_UNIT = {
    id: testUnitId1,
    disableKeepExecution: false,
    scenarioExecutions: generateTestUnitScenarioExecutions(),
  } as unknown as TestUnitModel;
  const keptExecutionDisabledPipeTransform = jest.fn().mockReturnValue(false);
  const testUnitMockSignal: WritableSignal<TestUnitModel | undefined> =
    signal(TEST_UNIT);
  const mockAppConfig = {
    apiUrl: "http://test-api.com",
  };
  const mockAuthenticationService = {};
  const mockAuthorizationService = {
    isAuthorized: jest.fn().mockReturnValue(of(true)),
  };

  beforeEach(async () => {
    stateService = {
      scenarioExecutionId: signal(scenarioExecutionId),
      testUnit: testUnitMockSignal,
    } as unknown as jest.Mocked<ScenarioExecutionStateManagementService>;

    await TestBed.configureTestingModule({
      declarations: [
        ScenarioExecutionHistoryComponent,
        DurationPipe,
        CommitIdShortnerPipe,
        DurationFormatterPipe,
      ],
      imports: [
        TableModule,
        ToggleSwitchModule,
        MockPipe(KeptExecutionDisabledPipe, keptExecutionDisabledPipeTransform),
        ShowElementIfAuthorizedDirective,
      ],
      providers: [
        provideMockStore({
          initialState: {},
        }),
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: stateService,
        },
        {
          provide: AuthenticationService,
          useValue: mockAuthenticationService,
        },
        { provide: AuthorizationService, useValue: mockAuthorizationService },
        {
          provide: APP_CONFIG,
          useValue: mockAppConfig,
        },
        DurationFormatterPipe,
        DatePipe,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionHistoryComponent);
    component = fixture.componentInstance;
  });

  describe("test unit scenario executions", () => {
    it("should be empty if test unit is undefined", fakeAsync(() => {
      testUnitMockSignal.set(undefined);
      tick();
      expect(component.testUnitScenarioExecutions()).toEqual([]);
    }));

    it("should be updated when the test unit is defined", fakeAsync(() => {
      testUnitMockSignal.set({
        ...TEST_UNIT,
        scenarioExecutions: generateTestUnitScenarioExecutions(),
      });
      tick();
      expect(component.testUnitScenarioExecutions()).toEqual(
        generateTestUnitScenarioExecutions()
      );
    }));
  });

  describe("isTargetExecution", () => {
    it("should compare targetExecutionId with scenarioExecution", () => {
      const data = {
        id: scenarioExecutionId,
      } as unknown as TestUnitScenarioExecutionModel;
      expect(component.isTargetExecution(data)).toBeTruthy();
    });
  });

  describe("analysis status column header", () => {
    let header: DebugElement;

    beforeEach(() => {
      fixture.detectChanges();
      header = fixture.debugElement.query(By.css("#analysis-status-header"));
    });

    it("should exist", () => {
      expect(header).toBeTruthy();
    });

    it("should have authorization directive", () => {
      const authDirective = ngMocks.findInstance(
        header,
        ShowElementIfAuthorizedDirective
      );
      expect(authDirective).toBeTruthy();
    });

    it("should have authorization directive with correct parameters", () => {
      const authDirective = ngMocks.findInstance(
        header,
        ShowElementIfAuthorizedDirective
      );
      expect(authDirective.showElementIfAuthorized).toEqual({
        action: "read_analysis_status",
        attributes: {},
        package: "test",
        resource: "scenario_execution",
      });
    });
  });

  describe("keep execution", () => {
    it("should not show kept execution header when keep execution flag is disabled for the test unit", () => {
      testUnitMockSignal.set({
        ...TEST_UNIT,
        disableKeepExecution: true,
      });
      fixture.detectChanges();
      const header = fixture.debugElement.query(
        By.css("#keep-execution-header")
      );

      expect(header).toBeNull();
    });

    it("should show kept execution header when keep execution flag is enabled for the test unit", () => {
      testUnitMockSignal.set({
        ...TEST_UNIT,
        disableKeepExecution: false,
      });
      fixture.detectChanges();
      const header = fixture.debugElement.query(
        By.css("#keep-execution-header")
      );
      expect(header).toBeTruthy();
    });

    it("should not show kept execution row when the test unit is undefined", () => {
      testUnitMockSignal.set(undefined);
      fixture.detectChanges();
      const row = fixture.debugElement.query(By.css("#keep-execution-row"));

      expect(row).toBeNull();
    });

    it("should not show kept execution row when keep execution flag is disabled for the test unit", () => {
      testUnitMockSignal.set({
        ...TEST_UNIT,
        disableKeepExecution: true,
      });
      fixture.detectChanges();
      const row = fixture.debugElement.query(By.css("#keep-execution-row"));

      expect(row).toBeNull();
    });

    it("should show kept execution row when keep execution flag is enabled for the test unit", () => {
      testUnitMockSignal.set({
        ...TEST_UNIT,
        disableKeepExecution: false,
      });
      fixture.detectChanges();
      const row = fixture.debugElement.query(By.css("#keep-execution-row"));
      expect(row).toBeTruthy();
    });
  });

  describe("analysis status column row", () => {
    let row: DebugElement;

    beforeEach(() => {
      fixture.detectChanges();
      row = fixture.debugElement.query(By.css("#analysis-status-row"));
    });

    it("should exist", () => {
      expect(row).toBeTruthy();
    });

    it("should have authorization directive", () => {
      const authDirective = ngMocks.findInstance(
        row,
        ShowElementIfAuthorizedDirective
      );
      expect(authDirective).toBeTruthy();
    });

    it("should have authorization directive with correct parameters", () => {
      const authDirective = ngMocks.findInstance(
        row,
        ShowElementIfAuthorizedDirective
      );
      expect(authDirective.showElementIfAuthorized).toEqual({
        action: "read_analysis_status",
        attributes: {},
        package: "test",
        resource: "scenario_execution",
      });
    });
  });

  describe("kept execution toggle", () => {
    it("should emit a kept execution toggled event", () => {
      const emitSpy = jest.spyOn(component.keptExecutionToggled, "emit");
      component.toggleKeptExecutionFlag("SCENARIO_EXECUTION");
      expect(emitSpy).toHaveBeenCalledWith("SCENARIO_EXECUTION");
    });

    it("should not show kept execution section when disable keep execution flag is true", () => {
      testUnitMockSignal.set({
        ...TEST_UNIT,
        disableKeepExecution: true,
      });
      fixture.detectChanges();

      const keepExecutionSection = fixture.debugElement.query(
        By.css("#keep-execution-section")
      );

      expect(keepExecutionSection).toBeNull();
    });

    it("should show kept execution section when disable keep execution flag is false", () => {
      testUnitMockSignal.set({
        ...TEST_UNIT,
        disableKeepExecution: false,
      });
      fixture.detectChanges();

      const keepExecutionSection = fixture.debugElement.query(
        By.css("#keep-execution-section")
      );

      expect(keepExecutionSection).toBeTruthy();
    });
  });

  function generateTestUnitScenarioExecutions(): TestUnitScenarioExecutionModel[] {
    return [
      {
        id: "0e458e29-038d-4250-b7f7-4042c448333a",
        status: ScenarioExecutionStatus.PASSED,
        analysisStatus: ScenarioAnalysisStatus.PASSED,
        commitId: "0869e48b-2fa6-41bf-beb9-9ac9896cff95",
        mxVersion: "v3.1.51",
        mxBuildId: "305c637b-c7dc-4810-9e4b-819b3a22134a",
        analysisObjects: {} as ScenarioExecutionAnalysisObjectsModel,
        environment: {} as ScenarioExecutionEnvironmentModel,
        keptExecution: false,
        startDate: "2024-01-01T10:00:00Z",
        endDate: "2024-01-01T10:30:00Z",
        factoryProductId: "factoryProductId",
        cleaningStatus: "NOT_LAUNCHED",
        isFailed: false,
        isFinished: true,
      },
    ];
  }
});
