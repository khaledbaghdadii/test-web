import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import {
  ScenarioRunDurationCellRendererComponent,
  ScenarioRunDurationCellRendererParams,
} from "./scenario-run-duration-cell-renderer.component";

describe("ScenarioRunDurationCellRendererComponent", () => {
  let component: ScenarioRunDurationCellRendererComponent;
  let fixture: ComponentFixture<ScenarioRunDurationCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioRunDurationCellRendererComponent],
    }).overrideComponent(ScenarioRunDurationCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(ScenarioRunDurationCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("sets start and end date from params", () => {
    component.agInit({
      startDate: "2026-01-15T10:00:00Z",
      endDate: "2026-01-15T12:30:00Z",
    } as ScenarioRunDurationCellRendererParams);

    expect(component.startDate).toBe("2026-01-15T10:00:00Z");
    expect(component.endDate).toBe("2026-01-15T12:30:00Z");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
