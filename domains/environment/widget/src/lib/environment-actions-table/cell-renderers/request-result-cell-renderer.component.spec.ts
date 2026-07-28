import { TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import type { ICellRendererParams } from "ag-grid-community";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import { RequestResultCellRendererComponent } from "./request-result-cell-renderer.component";

function createComponent(): RequestResultCellRendererComponent {
  TestBed.configureTestingModule({
    imports: [RequestResultCellRendererComponent],
  }).overrideComponent(RequestResultCellRendererComponent, {
    set: {
      imports: [],
      schemas: [NO_ERRORS_SCHEMA],
    },
  });

  return TestBed.createComponent(RequestResultCellRendererComponent)
    .componentInstance;
}

function init(
  component: RequestResultCellRendererComponent,
  request: ManagementRequest
): void {
  component.agInit({ data: request } as ICellRendererParams);
}

const BASE_REQUEST: ManagementRequest = {
  id: "req-1",
  type: "Deployment",
  status: "ENDED",
  createdOn: "2023-01-01T00:00:00Z",
};

describe("RequestResultCellRendererComponent", () => {
  it("is clickable when ended with a result message", () => {
    const component = createComponent();

    init(component, {
      ...BASE_REQUEST,
      status: "ENDED",
      resultMessage: "Deployment failed",
    });

    expect(component.isStatusClickable()).toBe(true);
  });

  it("is not clickable when ended without any message", () => {
    const component = createComponent();

    init(component, { ...BASE_REQUEST, status: "ENDED" });

    expect(component.isStatusClickable()).toBe(false);
  });

  it("is clickable when a status message is present and not ended", () => {
    const component = createComponent();

    init(component, {
      ...BASE_REQUEST,
      status: "RUNNING",
      statusMessage: "Still running",
    });

    expect(component.isStatusClickable()).toBe(true);
  });

  it("shows the result message in the dialog when ended", () => {
    const component = createComponent();

    init(component, {
      ...BASE_REQUEST,
      status: "ENDED",
      resultMessage: "Deployment failed",
    });

    expect(component.dialogMessage()).toBe("Deployment failed");
  });

  it("shows the status message in the dialog when not ended", () => {
    const component = createComponent();

    init(component, {
      ...BASE_REQUEST,
      status: "RUNNING",
      statusMessage: "Still running",
    });

    expect(component.dialogMessage()).toBe("Still running");
  });

  it("opens the dialog when the result is clickable", () => {
    const component = createComponent();
    init(component, {
      ...BASE_REQUEST,
      status: "ENDED",
      resultMessage: "Deployment failed",
    });

    component.openDialog();

    expect(component.dialogVisible()).toBe(true);
  });

  it("keeps the dialog closed when the result is not clickable", () => {
    const component = createComponent();
    init(component, { ...BASE_REQUEST, status: "ENDED" });

    component.openDialog();

    expect(component.dialogVisible()).toBe(false);
  });

  it("returns false from refresh", () => {
    const component = createComponent();

    expect(component.refresh()).toBe(false);
  });
});
