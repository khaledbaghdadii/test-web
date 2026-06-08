import { render, screen, waitFor } from "@testing-library/angular";
import { Subject, of, throwError } from "rxjs";
import { ConfigAuditButtonComponent } from "./config-audit-button.component";
import {
  SystematicConfigAuditService,
  SystematicConfigAuditOperationsResponse,
} from "@mxevolve/domains/environment/data-access";

const mockService = {
  retrieveSystematicConfigAudit: jest.fn(),
};

function endedSuccess(
  resultStatus: "PASS" | "WARNING" | "FAIL",
  artifacts: string[] = []
): SystematicConfigAuditOperationsResponse {
  return {
    operationId: "op-1",
    environmentId: "env-001",
    targetCommitId: "abc",
    requestStatus: "ENDED",
    requestResultStatus: "SUCCESS",
    configurationLintingResult: {
      resultStatus,
      artifacts,
      mode: "DELTA",
    },
  } as SystematicConfigAuditOperationsResponse;
}

async function renderComponent() {
  return render(ConfigAuditButtonComponent, {
    inputs: { projectId: "proj-001", environmentId: "env-001" },
    componentProviders: [
      { provide: SystematicConfigAuditService, useValue: mockService },
    ],
  });
}

describe("ConfigAuditButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Config Audit label", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of(endedSuccess("PASS"))
    );

    await renderComponent();

    await waitFor(() => expect(screen.getByText("Config Audit")).toBeTruthy());
  });

  it("shows a success severity for a PASS linting result", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of(endedSuccess("PASS"))
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.severity()).toBe("success")
    );
    expect(fixture.componentInstance.tooltip()).toBe(
      "This audit passed without violations."
    );
  });

  it("shows a warn severity for a WARNING linting result", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of(endedSuccess("WARNING"))
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.severity()).toBe("warn")
    );
  });

  it("shows a danger severity for a FAIL linting result", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of(endedSuccess("FAIL"))
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.severity()).toBe("danger")
    );
  });

  it("shows the primary severity and in-progress tooltip while the audit is running", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of({
        operationId: "op-1",
        environmentId: "env-001",
        targetCommitId: "abc",
        requestStatus: "STARTED",
      } as SystematicConfigAuditOperationsResponse)
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.tooltip()).toBe(
        "This audit is in progress"
      )
    );
    expect(fixture.componentInstance.severity()).toBe("primary");
    expect(fixture.componentInstance.showDropdown()).toBe(false);
  });

  it("renders a split-button with a CSV/HTML dropdown when artifacts are available", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of(
        endedSuccess("PASS", [
          "https://storage/report.csv",
          "https://storage/report.html",
        ])
      )
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.showDropdown()).toBe(true)
    );
    expect(document.querySelector("p-splitbutton")).toBeTruthy();
    const labels = fixture.componentInstance
      .dropdownItems()
      .map((item) => item.label);
    expect(labels).toEqual(["CSV", "HTML"]);
  });

  it("renders a plain button (no dropdown) when there are no artifacts", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of(endedSuccess("PASS"))
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.showDropdown()).toBe(false)
    );
    expect(document.querySelector("p-splitbutton")).toBeNull();
    expect(document.querySelector("p-button")).toBeTruthy();
  });

  it("shows a danger severity when the request status is INVALID", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      of({
        operationId: "op-1",
        environmentId: "env-001",
        targetCommitId: "abc",
        requestStatus: "INVALID",
        requestStatusMessage: "broken",
      } as SystematicConfigAuditOperationsResponse)
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.severity()).toBe("danger")
    );
    expect(fixture.componentInstance.tooltip()).toBe(
      "This audit failed : broken"
    );
  });

  it("shows a danger severity when the audit fetch errors", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      throwError(() => new Error("audit unavailable"))
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.severity()).toBe("danger")
    );
    expect(fixture.componentInstance.tooltip()).toBe("audit unavailable");
  });

  it("reports loading while the audit request is in flight", async () => {
    mockService.retrieveSystematicConfigAudit.mockReturnValue(
      new Subject<SystematicConfigAuditOperationsResponse>()
    );

    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.loading()).toBe(true);
  });
});
