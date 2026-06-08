import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScenarioExecutionIncidentsComponent } from "./scenario-execution-incidents.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { of, throwError } from "rxjs";
import {
  incidentId,
  incidents,
  projectId,
  scenarioExecutionId,
} from "../../../analysis-object-link/analysis-object-link-test-utils";
import { signal } from "@angular/core";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { IncidentsTableComponent } from "@mxflow/features/incident-management";
import { AnalysisObjectUnlinkModalComponent } from "../../../analysis-object-link/analysis-object-unlink-modal/analysis-object-unlink-modal.component";
import { MockComponent } from "ng-mocks";

describe("ScenarioExecutionIncidentsComponent", () => {
  let component: ScenarioExecutionIncidentsComponent;
  let fixture: ComponentFixture<ScenarioExecutionIncidentsComponent>;
  let toastMessageService: ToastMessageService;
  let stateService: ScenarioExecutionStateManagementService;

  beforeEach(async () => await setup());

  it("should initialize the linked incidents correctly", () => {
    expect(component.linkedIncidents()).toEqual(incidents);
  });

  it("should initialize the selected tab property correctly to false", () => {
    expect(component._isSelected).toBeFalsy();
  });

  it("should refresh the incident links upon selecting the incidents tab", () => {
    component.isSelected = true;
    fixture.detectChanges();
    expect(
      stateService.getScenarioExecutionAnalysisObjectLinks$
    ).toHaveBeenCalled();
  });

  it("should display an error message if failed to refresh the incident links upon selecting the incidents tab", () => {
    jest
      .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
      .mockImplementation(() =>
        throwError(() => new Error("a random error message"))
      );
    component.isSelected = true;
    fixture.detectChanges();
    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "Could not load incidents."
    );
  });

  it("should not refresh the incident links if the incident tab is closed", () => {
    component.isSelected = false;
    fixture.detectChanges();
    expect(
      stateService.getScenarioExecutionAnalysisObjectLinks$
    ).not.toHaveBeenCalled();
  });

  it("should initialize the incident loading correctly to false", () => {
    expect(component.isIncidentTableLoading).toBeFalsy();
  });

  it("should not change the table loading property if the incident tab is closed", () => {
    component.isSelected = false;
    fixture.detectChanges();
    expect(component.isIncidentTableLoading).toBeFalsy();
  });

  it("should set the incident loading to true while refreshing the linked incidents", () => {
    const isIncidentTableLoadingSpy = jest.spyOn(
      component,
      "isIncidentTableLoading",
      "set"
    );
    component.isSelected = true;
    fixture.detectChanges();
    expect(isIncidentTableLoadingSpy.mock.calls[0][0]).toBeTruthy();
  });

  it("should reset the incident loading to false after refreshing the linked incidents", async () => {
    component.isSelected = true;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isIncidentTableLoading).toBeFalsy();
  });

  it("should reset the incident loading to false when refreshing the linked incidents fails", async () => {
    jest
      .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
      .mockImplementation(() =>
        throwError(() => new Error("a random error message"))
      );
    component.isSelected = true;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isIncidentTableLoading).toBeFalsy();
  });

  it("should initialize the unlink modal visibility to false", () => {
    expect(component.isUnlinkModalVisible).toBeFalsy();
  });

  it("should open the unlink modal and change the incident id value correctly", () => {
    component.openUnlinkModal(incidentId);
    expect(component.incidentId).toEqual(incidentId);
    expect(component.isUnlinkModalVisible).toBeTruthy();
  });

  it("should set the modal visibility to false", () => {
    component.isUnlinkModalVisible = true;
    component.isVisibleChange(false);
    expect(component.isUnlinkModalVisible).toBeFalsy();
  });

  it("should set the modal visibility to true", () => {
    component.isUnlinkModalVisible = false;
    component.isVisibleChange(true);
    expect(component.isUnlinkModalVisible).toBeTruthy();
  });

  async function setup() {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    stateService = {
      projectId: signal(projectId),
      scenarioExecutionId: signal(scenarioExecutionId),
      getScenarioExecutionAnalysisObjectLinks$: jest.fn(() =>
        of(
          incidents.map((incident) => {
            return { analysisObjectId: incident.id };
          })
        )
      ),
      linkedIncidents: signal(incidents),
      unlink: jest.fn(() => of({})),
    } as unknown as ScenarioExecutionStateManagementService;

    await TestBed.configureTestingModule({
      declarations: [ScenarioExecutionIncidentsComponent],
      providers: [
        { provide: ToastMessageService, useValue: toastMessageService },
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: stateService,
        },
      ],
      imports: [
        HeaderTitleModule,
        IncidentsTableComponent,
        MockComponent(AnalysisObjectUnlinkModalComponent),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionIncidentsComponent);
    component = fixture.componentInstance;
  }
});
