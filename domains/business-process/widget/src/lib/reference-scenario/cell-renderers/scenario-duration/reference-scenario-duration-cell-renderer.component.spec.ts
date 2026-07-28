import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { ICellRendererParams } from "ag-grid-community";
import { ReferenceScenarioDurationCellRendererComponent } from "./reference-scenario-duration-cell-renderer.component";
import { ReferenceScenario } from "@mxevolve/domains/business-process/data-access";

const buildParams = (
  data?: Partial<ReferenceScenario>
): ICellRendererParams<ReferenceScenario> =>
  ({
    data,
  } as ICellRendererParams<ReferenceScenario>);

describe("ReferenceScenarioDurationCellRendererComponent", () => {
  let component: ReferenceScenarioDurationCellRendererComponent;
  let fixture: ComponentFixture<ReferenceScenarioDurationCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReferenceScenarioDurationCellRendererComponent],
    });

    fixture = TestBed.createComponent(
      ReferenceScenarioDurationCellRendererComponent
    );
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets start and end time from the scenario row", () => {
    component.agInit(
      buildParams({
        scenarioStartDate: "2026-03-01T10:00:00Z",
        scenarioEndDate: "2026-03-01T11:30:00Z",
      })
    );

    expect(component.startTime).toBe("2026-03-01T10:00:00Z");
    expect(component.endTime).toBe("2026-03-01T11:30:00Z");
  });

  it("leaves times undefined when the row has no data", () => {
    component.agInit(buildParams());

    expect(component.startTime).toBeUndefined();
    expect(component.endTime).toBeUndefined();
  });

  it("renders the formatted duration when an end time is present", () => {
    component.agInit(
      buildParams({
        scenarioStartDate: "2026-03-01T10:00:00Z",
        scenarioEndDate: "2026-03-01T11:30:00Z",
      })
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("1h 30m");
  });

  it("renders a dash when there is no end time", () => {
    component.agInit(
      buildParams({ scenarioStartDate: "2026-03-01T10:00:00Z" })
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
