import { render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { AnalysisStatusDisplayComponent } from "./analysis-status-display.component";
import { AnalysisStatus } from "@mxevolve/domains/test/model";

const MOCK_IMPORTS = [MockComponent(MxevolveIconComponent), Tag];

async function renderWithStatus(status: string) {
  return render(AnalysisStatusDisplayComponent, {
    inputs: { status },
    componentImports: MOCK_IMPORTS,
  });
}

describe("AnalysisStatusDisplayComponent", () => {
  it.each([
    [AnalysisStatus.NA, "N/A"],
    [AnalysisStatus.ASSIGNED, "Assigned"],
    [AnalysisStatus.UNDER_ANALYSIS, "Under Analysis"],
    [AnalysisStatus.INCIDENT_SENT, "Incident Sent"],
    [AnalysisStatus.PASSED, "Passed"],
    [AnalysisStatus.FAILED, "Failed"],
    [AnalysisStatus.CANCELLED, "Cancelled"],
  ])("shows '%s' label as '%s'", async (status, expectedLabel) => {
    await renderWithStatus(status);

    expect(screen.getByText(expectedLabel)).toBeTruthy();
  });

  it.each([
    [AnalysisStatus.NA, "secondary"],
    [AnalysisStatus.ASSIGNED, "warn"],
    [AnalysisStatus.UNDER_ANALYSIS, "info"],
    [AnalysisStatus.INCIDENT_SENT, "info"],
    [AnalysisStatus.PASSED, "success"],
    [AnalysisStatus.FAILED, "danger"],
    [AnalysisStatus.CANCELLED, "danger"],
  ])("renders '%s' with '%s' severity", async (status, expectedSeverity) => {
    const { fixture } = await renderWithStatus(status);

    const tag = ngMocks.find(fixture, Tag);
    expect(ngMocks.input(tag, "severity")).toBe(expectedSeverity);
  });

  it.each([
    [AnalysisStatus.NA, "remove_circle_outline"],
    [AnalysisStatus.ASSIGNED, "person"],
    [AnalysisStatus.UNDER_ANALYSIS, "search"],
    [AnalysisStatus.INCIDENT_SENT, "mark_email_read"],
    [AnalysisStatus.PASSED, "check_circle"],
    [AnalysisStatus.FAILED, "cancel"],
    [AnalysisStatus.CANCELLED, "cancel"],
  ])("renders '%s' with '%s' icon", async (status, expectedIcon) => {
    const { fixture } = await renderWithStatus(status);

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe(expectedIcon);
  });

  it("falls back to N/A for unknown status", async () => {
    const { fixture } = await renderWithStatus("SomeUnknown");

    expect(screen.getByText("N/A")).toBeTruthy();
    const tag = ngMocks.find(fixture, Tag);
    expect(ngMocks.input(tag, "severity")).toBe("secondary");
  });

  it("falls back to N/A for empty status", async () => {
    await renderWithStatus("");

    expect(screen.getByText("N/A")).toBeTruthy();
  });
});
