import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import {
  ScenarioRunNameCellRendererComponent,
  ScenarioRunNameCellRendererParams,
} from "./scenario-run-name-cell-renderer.component";

describe("ScenarioRunNameCellRendererComponent", () => {
  let component: ScenarioRunNameCellRendererComponent;
  let fixture: ComponentFixture<ScenarioRunNameCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioRunNameCellRendererComponent],
    }).overrideComponent(ScenarioRunNameCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(ScenarioRunNameCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("sets name and scenario run id and project id from params", () => {
    component.agInit({
      value: "Regression Suite",
      scenarioRunId: "run-123",
      projectId: "proj-1",
    } as ScenarioRunNameCellRendererParams);

    expect(component.name).toBe("Regression Suite");
    expect(component.scenarioRunId).toBe("run-123");
    expect(component.projectId).toBe("proj-1");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
