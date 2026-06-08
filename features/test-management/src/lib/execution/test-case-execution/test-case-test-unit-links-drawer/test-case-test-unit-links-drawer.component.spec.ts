import { TestCaseTestUnitLinksDrawerComponent } from "./test-case-test-unit-links-drawer.component";
import { Drawer } from "primeng/drawer";
import { By } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { signal, WritableSignal } from "@angular/core";
import { TestUnitAnalysisObjectLink } from "../../analysis-object-link/analysis-object-link";
import { MockBuilder, MockRender } from "ng-mocks";
import { TestCaseExecution } from "../test-case-execution";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { Table } from "primeng/table";
import {
  DetectionCategory,
  DetectionType,
  DetectionUriBuilderPipe,
} from "@mxflow/features/failure-management";

describe("TestCaseTestUnitLinksDrawerComponent", () => {
  let stateService: ScenarioExecutionStateManagementService;
  let testCaseTestUnitAnalysisObjectLinksMap: WritableSignal<
    Map<string, TestUnitAnalysisObjectLink[]>
  >;
  let testUnitAnalysisObjectLinksLoading: WritableSignal<boolean>;
  let mockDetectionUriBuilderPipe: { transform: jest.Mock };

  beforeEach(async () => {
    mockDetectionUriBuilderPipe = {
      transform: jest.fn().mockReturnValue("mocked-link"),
    };

    testCaseTestUnitAnalysisObjectLinksMap = signal<
      Map<string, TestUnitAnalysisObjectLink[]>
    >(new Map());
    testUnitAnalysisObjectLinksLoading = signal(false);
    stateService = {
      testCaseTestUnitAnalysisObjectLinksMap:
        testCaseTestUnitAnalysisObjectLinksMap,
      testUnitAnalysisObjectLinksLoading: testUnitAnalysisObjectLinksLoading,
    } as unknown as ScenarioExecutionStateManagementService;

    await MockBuilder(TestCaseTestUnitLinksDrawerComponent)
      .mock(ScenarioExecutionStateManagementService, stateService)
      .provide(provideNoopAnimations())
      .keep(Drawer)
      .keep(Table)
      .beforeCompileComponents((testBed) => {
        testBed.overrideComponent(TestCaseTestUnitLinksDrawerComponent, {
          remove: { providers: [DetectionUriBuilderPipe] },
          add: {
            providers: [
              {
                provide: DetectionUriBuilderPipe,
                useValue: mockDetectionUriBuilderPipe,
              },
            ],
          },
        });
      });
  });

  it("should create", () => {
    const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
      testCaseExecution: undefined,
    });
    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });

  it("setting visible to true should display the drawer", () => {
    const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
      testCaseExecution: undefined,
      visible: false,
    });
    const component = fixture.point.componentInstance;

    component.visible.set(true);
    fixture.detectChanges();

    const drawerElement = fixture.debugElement.query(By.directive(Drawer));
    expect(drawerElement).toBeTruthy();
    expect(drawerElement.componentInstance.visible).toBe(true);
  });

  it("setting visible to false should hide the drawer", () => {
    const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
      testCaseExecution: undefined,
      visible: true,
    });
    const component = fixture.point.componentInstance;

    component.visible.set(false);
    fixture.detectChanges();

    const drawerElement = fixture.debugElement.query(By.directive(Drawer));
    expect(drawerElement).toBeTruthy();
    expect(drawerElement.componentInstance.visible).toBe(false);
  });

  it("should display the drawer header correctly", () => {
    const testCaseExecutionMock = {
      title: "Test Case 1",
      functionalTestCaseId: "FTC-001",
    };
    const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
      visible: true,
      testCaseExecution: testCaseExecutionMock,
    });
    fixture.detectChanges();

    const drawerHeader = fixture.debugElement.query(By.directive(Drawer))
      .componentInstance.header;
    expect(drawerHeader).toBe("Test Case 1 - FTC-001 Links");
  });

  it("should display default drawer header when testCaseExecution is undefined", () => {
    const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
      visible: true,
      testCaseExecution: undefined,
    });
    fixture.detectChanges();
    const drawerHeader = fixture.debugElement.query(By.directive(Drawer))
      .componentInstance.header;
    expect(drawerHeader).toBe("Links");
  });

  it("should display skeleton rows when loading", () => {
    testUnitAnalysisObjectLinksLoading.set(true);

    const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
      visible: true,
      testCaseExecution: { externalId: "ext-123" } as TestCaseExecution,
    });
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(Table));
    expect(table.componentInstance.loading).toBe(true);
  });

  describe("testCaseTestUnitLinksTableData", () => {
    it("should return empty array when testCaseExecution is undefined", () => {
      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution: undefined,
      });
      const component = fixture.point.componentInstance;

      expect(component.testCaseTestUnitLinksTableData()).toEqual([]);
    });

    it("should return empty array when no links exist for the test case", () => {
      const testCaseExecution = {
        externalId: "ext-123",
      } as TestCaseExecution;

      testCaseTestUnitAnalysisObjectLinksMap.set(new Map());

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(component.testCaseTestUnitLinksTableData()).toEqual([]);
    });

    it("should map links to table data correctly for non-INCIDENT type", () => {
      const testCaseExecution = {
        externalId: "ext-123",
      } as TestCaseExecution;

      const link: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "ao-1",
          type: AnalysisObjectType.BINARY_REGRESSION,
          title: "Binary Regression Title",
          readableId: "BR-001",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [link]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(component.testCaseTestUnitLinksTableData()).toEqual([
        {
          projectId: "project-1",
          analysisObjectId: "ao-1",
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          analysisObjectTitle: "Binary Regression Title",
          analysisObjectLink: "mocked-link",
          scenarioExecutionId: "se-1",
        },
      ]);
    });

    it("should include readableId in title for INCIDENT type", () => {
      const testCaseExecution = {
        externalId: "ext-123",
      } as TestCaseExecution;

      const incidentLink: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "incident-1",
          type: AnalysisObjectType.INCIDENT,
          title: "Incident Title",
          readableId: "INC-001",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [incidentLink]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(component.testCaseTestUnitLinksTableData().length).toBe(1);
      expect(component.testCaseTestUnitLinksTableData()[0]).toEqual(
        expect.objectContaining({
          analysisObjectTitle: "INC-001 - Incident Title",
        })
      );
    });

    it("should map multiple links correctly with mixed types", () => {
      const testCaseExecution = {
        externalId: "ext-123",
      } as TestCaseExecution;
      const incidentLink: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "incident-1",
          type: AnalysisObjectType.INCIDENT,
          title: "Incident Title",
          readableId: "INC-001",
        },
        testUnitId: "tu-1",
      };

      const binaryRegressionLink: TestUnitAnalysisObjectLink = {
        projectId: "project-2",
        scenarioExecutionId: "se-2",
        testCaseExecution: { id: "tce-2", externalId: "ext-123" },
        analysisObject: {
          id: "br-1",
          type: AnalysisObjectType.BINARY_REGRESSION,
          title: "Binary Regression Title",
        },
        testUnitId: "tu-2",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [incidentLink, binaryRegressionLink]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(component.testCaseTestUnitLinksTableData()).toEqual([
        {
          projectId: "project-1",
          analysisObjectId: "incident-1",
          analysisObjectType: AnalysisObjectType.INCIDENT,
          analysisObjectTitle: "INC-001 - Incident Title",
          analysisObjectLink: "",
          scenarioExecutionId: "se-1",
        },
        {
          projectId: "project-2",
          analysisObjectId: "br-1",
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          analysisObjectTitle: "Binary Regression Title",
          analysisObjectLink: "mocked-link",
          scenarioExecutionId: "se-2",
        },
      ]);
    });
  });

  describe("resolveTestUnitAnalysisObjectLink", () => {
    it("should generate link to binary regression details screen for binary regression analysis objects", () => {
      const testCaseExecution = { externalId: "ext-123" } as TestCaseExecution;
      const link: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "br-123",
          type: AnalysisObjectType.BINARY_REGRESSION,
          title: "Binary Regression",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [link]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(
        component.testCaseTestUnitLinksTableData()[0].analysisObjectLink
      ).toBe("mocked-link");
      expect(mockDetectionUriBuilderPipe.transform).toHaveBeenCalledWith({
        category: DetectionCategory.Regression,
        type: DetectionType.Binary,
        id: "br-123",
      });
    });

    it("should generate link to binary impact details screen for binary impact analysis objects", () => {
      const testCaseExecution = { externalId: "ext-123" } as TestCaseExecution;
      const link: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "bi-123",
          type: AnalysisObjectType.BINARY_IMPACT,
          title: "Binary Impact",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [link]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(
        component.testCaseTestUnitLinksTableData()[0].analysisObjectLink
      ).toBe("mocked-link");
      expect(mockDetectionUriBuilderPipe.transform).toHaveBeenCalledWith({
        category: DetectionCategory.Impact,
        type: DetectionType.Binary,
        id: "bi-123",
        projectId: "project-1",
      });
    });

    it("should generate link to configuration impact details screen for configuration impact analysis objects", () => {
      const testCaseExecution = { externalId: "ext-123" } as TestCaseExecution;
      const link: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "ci-123",
          type: AnalysisObjectType.CONFIGURATION_IMPACT,
          title: "Configuration Impact",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [link]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(
        component.testCaseTestUnitLinksTableData()[0].analysisObjectLink
      ).toBe("mocked-link");
      expect(mockDetectionUriBuilderPipe.transform).toHaveBeenCalledWith({
        category: DetectionCategory.Impact,
        type: DetectionType.Configuration,
        id: "ci-123",
        projectId: "project-1",
      });
    });

    it("should generate link to configuration regression details screen for configuration regression analysis objects", () => {
      const testCaseExecution = { externalId: "ext-123" } as TestCaseExecution;
      const link: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "cr-123",
          type: AnalysisObjectType.CONFIGURATION_REGRESSION,
          title: "Configuration Regression",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [link]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(
        component.testCaseTestUnitLinksTableData()[0].analysisObjectLink
      ).toBe("mocked-link");
      expect(mockDetectionUriBuilderPipe.transform).toHaveBeenCalledWith({
        category: DetectionCategory.Regression,
        type: DetectionType.Configuration,
        id: "cr-123",
        projectId: "project-1",
      });
    });

    it("should set the link of an incident analysis object to externalLink", () => {
      const testCaseExecution = { externalId: "ext-123" } as TestCaseExecution;
      const link: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "inc-123",
          type: AnalysisObjectType.INCIDENT,
          title: "Incident",
          readableId: "INC-123",
          externalLink: "http://example.com/inc-123",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [link]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);

      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;

      expect(
        component.testCaseTestUnitLinksTableData()[0].analysisObjectLink
      ).toBe("http://example.com/inc-123");
      expect(mockDetectionUriBuilderPipe.transform).not.toHaveBeenCalled();
    });

    it("should set the link of an incident analysis object to empty string if externalLink is undefined", () => {
      const testCaseExecution = { externalId: "ext-123" } as TestCaseExecution;
      const link: TestUnitAnalysisObjectLink = {
        projectId: "project-1",
        scenarioExecutionId: "se-1",
        testCaseExecution: { id: "tce-1", externalId: "ext-123" },
        analysisObject: {
          id: "inc-123",
          type: AnalysisObjectType.INCIDENT,
          title: "Incident",
          readableId: "INC-123",
        },
        testUnitId: "tu-1",
      };

      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set("ext-123", [link]);
      testCaseTestUnitAnalysisObjectLinksMap.set(linksMap);
      const fixture = MockRender(TestCaseTestUnitLinksDrawerComponent, {
        testCaseExecution,
      });
      const component = fixture.point.componentInstance;
      expect(
        component.testCaseTestUnitLinksTableData()[0].analysisObjectLink
      ).toBe("");
      expect(mockDetectionUriBuilderPipe.transform).not.toHaveBeenCalled();
    });
  });
});
