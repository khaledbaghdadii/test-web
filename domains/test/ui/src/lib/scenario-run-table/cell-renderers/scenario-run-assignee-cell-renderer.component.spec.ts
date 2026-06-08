import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import {
  ScenarioRunAssigneeCellRendererComponent,
  ScenarioRunAssigneeCellRendererParams,
} from "./scenario-run-assignee-cell-renderer.component";

describe("ScenarioRunAssigneeCellRendererComponent", () => {
  let component: ScenarioRunAssigneeCellRendererComponent;
  let fixture: ComponentFixture<ScenarioRunAssigneeCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioRunAssigneeCellRendererComponent],
    }).overrideComponent(ScenarioRunAssigneeCellRendererComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    });

    fixture = TestBed.createComponent(ScenarioRunAssigneeCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("sets assigneeDisplayName and assigneeEmail from params", () => {
    component.agInit({
      value: "John Doe",
      assigneeEmail: "john.doe@example.com",
    } as ScenarioRunAssigneeCellRendererParams);
    fixture.detectChanges();

    expect(component.assigneeDisplayName).toBe("John Doe");
    expect(component.assigneeEmail).toBe("john.doe@example.com");
  });

  it("sets undefined assigneeDisplayName and assigneeEmail when values are missing", () => {
    component.agInit({
      value: undefined,
      assigneeEmail: undefined,
    } as unknown as ScenarioRunAssigneeCellRendererParams);
    fixture.detectChanges();

    expect(component.assigneeDisplayName).toBeUndefined();
    expect(component.assigneeEmail).toBeUndefined();
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
