import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ScenarioRunCommitIdCellRendererComponent } from "./scenario-run-commit-id-cell-renderer.component";
import type { ICellRendererParams } from "ag-grid-community";

describe("ScenarioRunCommitIdCellRendererComponent", () => {
  let component: ScenarioRunCommitIdCellRendererComponent;
  let fixture: ComponentFixture<ScenarioRunCommitIdCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioRunCommitIdCellRendererComponent],
    }).overrideComponent(ScenarioRunCommitIdCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(ScenarioRunCommitIdCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("sets commit id from params", () => {
    component.agInit({
      value: "abc123def456ghi789",
    } as ICellRendererParams);

    expect(component.commitId).toBe("abc123def456ghi789");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
