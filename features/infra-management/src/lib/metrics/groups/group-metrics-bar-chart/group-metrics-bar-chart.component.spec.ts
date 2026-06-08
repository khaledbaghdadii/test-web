import { GroupMetricsBarChartStateService } from "./state-service/group-metrics-bar-chart-state.service";
import { GroupMetricsBarChartComponent } from "./group-metrics-bar-chart.component";
import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import {
  InfraGroupsService,
  SelectedGroup,
} from "@mxflow/features/infra-management";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { NO_ERRORS_SCHEMA } from "@angular/compiler";
import { AgChartsModule } from "ag-charts-angular";
import { GroupsDataProvider } from "../../../groups-multi-selection-filter/data-provider/groups-data-provider";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import {
  GroupedBarChartData,
  GroupMetricsBarChartOptionsGenerator,
} from "./utils/option/group-metrics-bar-chart-option-generator-service";

const PROJECT_ID = "projectId";

const selectedGroup1: SelectedGroup = {
  id: "id1",
  projectId: "projectId",
  name: "name1",
};
const selectedGroup2: SelectedGroup = {
  id: "id2",
  projectId: "projectId",
  name: "name2",
};
const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";

describe("Group metrics bar chart component test", () => {
  let stateService: Partial<GroupMetricsBarChartStateService>;
  let mockDataProvider: jest.Mocked<GroupsDataProvider>;
  let mockGroupsService: jest.Mocked<InfraGroupsService>;
  let mockOptionsGenerator: jest.Mocked<GroupMetricsBarChartOptionsGenerator>;
  const groupNamesWithNoMetrics = signal<string[]>([]);
  const stackedDataSignal = signal<GroupedBarChartData>({
    data: [],
    families: [],
  });
  const shouldShowChart = signal(false);
  const shouldShowGroupNamesWithNoMetricsMessage = signal(false);

  let component: GroupMetricsBarChartComponent;
  let fixture: ComponentFixture<GroupMetricsBarChartComponent>;
  beforeEach(async () => {
    stateService = {
      setProjectId: jest.fn(),
      setGroupIds: jest.fn(),
      setGroupNames: jest.fn(),
      groupNamesWithNoMetrics: groupNamesWithNoMetrics,
      stackedData: stackedDataSignal,
      shouldShowChart: shouldShowChart,
      shouldShowGroupNamesWithNoMetricsMessage:
        shouldShowGroupNamesWithNoMetricsMessage,
      errorMessageSubject: new Subject<string>(),
    } satisfies Partial<GroupMetricsBarChartStateService>;
    mockGroupsService = {
      searchGroups: jest
        .fn()
        .mockReturnValue(
          of({ content: [selectedGroup1, selectedGroup2], last: false })
        ),
    } as unknown as jest.Mocked<InfraGroupsService>;
    mockDataProvider = {
      fetchData: jest
        .fn()
        .mockReturnValue(
          of({ content: [selectedGroup1, selectedGroup2], last: false })
        ),
      toDropdownOption: jest.fn((group: SelectedGroup) => ({
        label: group.name,
        value: group,
      })),
      getItemId: jest.fn((group: SelectedGroup) => group.id),
    } as unknown as jest.Mocked<GroupsDataProvider>;
    mockOptionsGenerator = {
      toGroupedData: jest.fn().mockReturnValue({ data: [], families: [] }),
      buildChartOptions: jest.fn().mockReturnValue({}),
      mapToGroupedData: jest.fn().mockReturnValue({ data: [], families: [] }),
    } as unknown as jest.Mocked<GroupMetricsBarChartOptionsGenerator>;
    const mockAppConfig = {
      gatewayUrl: MOCK_GATEWAY_URL,
    };

    await TestBed.configureTestingModule({
      imports: [
        GroupMetricsBarChartComponent,
        NoopAnimationsModule,
        ErrorAlertComponent,
        AgChartsModule,
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(GroupMetricsBarChartComponent, {
        set: {
          providers: [
            {
              provide: GroupMetricsBarChartStateService,
              useValue: stateService,
            },
            {
              provide: GroupMetricsBarChartOptionsGenerator,
              useValue: mockOptionsGenerator,
            },
            {
              provide: GroupsDataProvider,
              useValue: mockDataProvider,
            },
            {
              provide: InfraGroupsService,
              useValue: mockGroupsService,
            },
            { provide: APP_CONFIG, useValue: mockAppConfig },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GroupMetricsBarChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.detectChanges();
  });

  describe("initialization", () => {
    it("should initialize component with required projectId", () => {
      component.ngOnInit();
      expect(stateService.setProjectId).toHaveBeenCalledWith(PROJECT_ID);
    });

    it("should handle error from state service", () => {
      const errorMessage = "Error occurred";
      component.stateService.errorMessageSubject.next(errorMessage);
      expect(component.groupMetricsErrorMessage()).toBe(errorMessage);
    });
  });

  describe("handleGroupListChange", () => {
    it("should update group ids and names in state service", () => {
      const groups = [
        { id: "group1", name: "Group 1" },
        { id: "group2", name: "Group 2" },
      ] as unknown as SelectedGroup[];
      component.handleGroupListChange(groups);
      expect(stateService.setGroupIds).toHaveBeenCalledWith([
        "group1",
        "group2",
      ]);
      expect(stateService.setGroupNames).toHaveBeenCalledWith([
        "Group 1",
        "Group 2",
      ]);
    });
  });

  describe("handleGroupMultiselectError", () => {
    it("should set the group multiselect error message", () => {
      const errorMessage = "Multiselect error";
      component.handleGroupMultiselectError(errorMessage);
      expect(component.groupMultiselectErrorMessage()).toBe(errorMessage);
    });
  });

  describe("reading signals from state service", () => {
    it("should read groupNamesWithNoMetrics signal", () => {
      const groupNames = ["Group A", "Group B"];
      groupNamesWithNoMetrics.set(groupNames);
      expect(component.groupNamesWithNoMetrics()).toBe(groupNames);
    });

    it("should read chartOptions signal via optionsGenerator", () => {
      expect(component.optionsGenerator).toBe(mockOptionsGenerator);
      component.chartOptions();
      expect(mockOptionsGenerator.buildChartOptions).toHaveBeenCalledWith({
        data: [],
        families: [],
      });
    });

    it("should read shouldShowChart signal", () => {
      shouldShowChart.set(true);
      expect(component.shouldShowChart()).toBe(true);
      shouldShowChart.set(false);
      expect(component.shouldShowChart()).toBe(false);
    });

    it("should read shouldShowGroupNamesWithNoMetricsMessage signal", () => {
      shouldShowGroupNamesWithNoMetricsMessage.set(true);
      expect(component.shouldShowGroupNamesWithNoMetricsMessage()).toBe(true);
      shouldShowGroupNamesWithNoMetricsMessage.set(false);
      expect(component.shouldShowGroupNamesWithNoMetricsMessage()).toBe(false);
    });
  });

  describe("DOM tests", () => {
    it("should display error alert when groupMultiselectErrorMessage is set", () => {
      const errorMessage = "Multiselect error";
      component.handleGroupMultiselectError(errorMessage);
      fixture.detectChanges();
      const alertElement = fixture.debugElement.query(
        By.css('[data-testid="group-multiselect-error"]')
      );
      expect(alertElement).toBeTruthy();
      expect(alertElement.componentInstance.errorMessage).toBe(errorMessage);
      expect(alertElement.componentInstance.closeable).toBeFalsy();
    });

    it("should not display error alert when groupMultiselectErrorMessage is not set", () => {
      const alertElement = fixture.debugElement.query(
        By.css('[data-testid="group-multiselect-error"]')
      );
      expect(alertElement).toBeNull();
    });

    it("should display error alert when group metrics error message is set", () => {
      const errorMessage = "Error occurred";
      component.stateService.errorMessageSubject.next(errorMessage);
      expect(component.groupMetricsErrorMessage()).toBe(errorMessage);
      fixture.detectChanges();
      const alertElement = fixture.debugElement.query(
        By.css('[data-testid="group-metrics-error"]')
      );
      expect(alertElement).toBeTruthy();
      expect(alertElement.componentInstance.errorMessage).toBe(errorMessage);
      expect(alertElement.componentInstance.closeable).toBeFalsy();
    });

    it("should not display error alert when group metrics error message is not set", () => {
      const alertElement = fixture.debugElement.query(
        By.css('[data-testid="group-metrics-error"]')
      );
      expect(alertElement).toBeNull();
    });

    it("should display warning alert when shouldShowGroupNamesWithNoMetricsMessage is true", () => {
      shouldShowGroupNamesWithNoMetricsMessage.set(true);
      const groupNames = ["Group A", "Group B"];
      groupNamesWithNoMetrics.set(groupNames);
      fixture.detectChanges();
      const alertElement = fixture.debugElement.query(
        By.css('[data-testid="group-names-with-no-metrics-message"]')
      );
      expect(alertElement).toBeTruthy();
      expect(alertElement.componentInstance.errorMessage).toBe(
        "We were not able to calculate the metrics on these groups: Group A, Group B"
      );
      expect(alertElement.componentInstance.closeable).toBeFalsy();
      expect(alertElement.componentInstance.errorDetails).toBe(
        `
    1. No environment was deployed using the group
    2. If you already deployed on the group and you do not have metrics contact your support team for any technical failure`
      );
    });

    it("should not display warning alert when shouldShowGroupNamesWithNoMetricsMessage is false", () => {
      shouldShowGroupNamesWithNoMetricsMessage.set(false);
      fixture.detectChanges();
      const alertElement = fixture.debugElement.query(
        By.css('[data-testid="group-names-with-no-metrics-message"]')
      );
      expect(alertElement).toBeNull();
    });
  });
});
