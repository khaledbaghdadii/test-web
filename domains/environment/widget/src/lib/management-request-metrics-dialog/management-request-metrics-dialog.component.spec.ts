import { render } from "@testing-library/angular";
import { Dialog } from "primeng/dialog";
import { MockComponent, ngMocks } from "ng-mocks";
import { ManagementRequestMetricsTableComponent } from "../management-request-metrics-table/management-request-metrics-table.component";
import { ManagementRequestMetricsDialogComponent } from "./management-request-metrics-dialog.component";

const REQUIRED_INPUTS = {
  projectId: "proj-1",
  environmentId: "env-1",
  managementRequestId: "req-1",
  visible: false,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ManagementRequestMetricsDialogComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: [
      Dialog,
      MockComponent(ManagementRequestMetricsTableComponent),
    ],
  });
}

describe("ManagementRequestMetricsDialogComponent", () => {
  it("creates the component", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it("does not render the metrics table when hidden", async () => {
    const { fixture } = await renderComponent({ visible: false });

    expect(
      ngMocks.find(fixture, ManagementRequestMetricsTableComponent, null)
    ).toBeNull();
  });

  it("renders the metrics table when visible", async () => {
    const { fixture } = await renderComponent({ visible: true });

    expect(
      ngMocks.find(fixture, ManagementRequestMetricsTableComponent, null)
    ).toBeTruthy();
  });

  it("passes the management request id to the metrics table", async () => {
    const { fixture } = await renderComponent({ visible: true });

    const table = ngMocks.find(fixture, ManagementRequestMetricsTableComponent);
    expect(ngMocks.input(table, "managementRequestId")).toBe("req-1");
  });

  it("emits closed when the dialog is dismissed", async () => {
    const { fixture } = await renderComponent({ visible: true });
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const dialog = ngMocks.find(fixture, Dialog);
    ngMocks.output(dialog, "visibleChange").emit(false);

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });
});
