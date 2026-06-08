import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { CommitIdCellRendererComponent } from "./commit-id-cell-renderer.component";
import type { ICellRendererParams } from "ag-grid-community";

describe("CommitIdCellRendererComponent", () => {
  let component: CommitIdCellRendererComponent;
  let fixture: ComponentFixture<CommitIdCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommitIdCellRendererComponent],
    }).overrideComponent(CommitIdCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(CommitIdCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets commit id from params value", () => {
    component.agInit({
      value: "abc1234567890def",
    } as ICellRendererParams);

    expect(component.commitId).toBe("abc1234567890def");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
