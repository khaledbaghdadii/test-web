import { MockBuilder, MockRender, ngMocks } from "ng-mocks";
import { Button } from "primeng/button";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import {
  CopyToClipboardComponent,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import { ManagementRequestMetricsDialogComponent } from "../../management-request-metrics-dialog/management-request-metrics-dialog.component";
import {
  RequestActionsCellRendererComponent,
  RequestActionsCellRendererParams,
} from "./request-actions-cell-renderer.component";

const BASE_REQUEST: ManagementRequest = {
  id: "req-1",
  type: "Deployment",
  status: "ENDED",
  createdOn: "2023-01-01T00:00:00Z",
  hasMetrics: true,
};

function renderComponent(requestOverrides: Partial<ManagementRequest> = {}) {
  const fixture = MockRender(RequestActionsCellRendererComponent);
  const component = fixture.point.componentInstance;
  component.agInit({
    data: { ...BASE_REQUEST, ...requestOverrides },
    projectId: "proj-1",
    environmentId: "env-1",
  } as RequestActionsCellRendererParams);
  fixture.detectChanges();
  return { fixture, component };
}

describe("RequestActionsCellRendererComponent", () => {
  beforeEach(() =>
    MockBuilder(RequestActionsCellRendererComponent)
      .mock(CopyToClipboardComponent)
      .mock(ManagementRequestMetricsDialogComponent)
  );

  it("passes the request id to the copy button", () => {
    const { fixture } = renderComponent();

    const copy = ngMocks.find(fixture, CopyToClipboardComponent);
    expect(ngMocks.input(copy, "value")).toBe("req-1");
  });

  it("shows the metrics button when the request has metrics", () => {
    const { fixture } = renderComponent({ hasMetrics: true });

    expect(ngMocks.find(fixture, MxevolveIconComponent, null)).toBeTruthy();
  });

  it("hides the metrics button when the request has no metrics", () => {
    const { fixture } = renderComponent({ hasMetrics: false });

    expect(ngMocks.find(fixture, Button, null)).toBeNull();
  });

  it("passes the request id to the metrics dialog", () => {
    const { fixture } = renderComponent();

    const dialog = ngMocks.find(
      fixture,
      ManagementRequestMetricsDialogComponent
    );
    expect(ngMocks.input(dialog, "managementRequestId")).toBe("req-1");
  });

  it("opens the metrics dialog when the metrics button is clicked", () => {
    const { fixture, component } = renderComponent();

    component.openMetrics();
    fixture.detectChanges();

    const dialog = ngMocks.find(
      fixture,
      ManagementRequestMetricsDialogComponent
    );
    expect(ngMocks.input(dialog, "visible")).toBe(true);
  });

  it("returns false from refresh", () => {
    const { component } = renderComponent();

    expect(component.refresh()).toBe(false);
  });
});
