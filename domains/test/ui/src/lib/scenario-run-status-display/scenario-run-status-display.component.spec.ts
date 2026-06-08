import { render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ScenarioRunStatusDisplayComponent } from "./scenario-run-status-display.component";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";

const MOCK_IMPORTS = [MockComponent(MxevolveIconComponent), Tag];

async function renderWithStatus(status: ScenarioRunStatus) {
  return render(ScenarioRunStatusDisplayComponent, {
    inputs: { status },
    componentImports: MOCK_IMPORTS,
  });
}

describe("ScenarioRunStatusDisplayComponent", () => {
  it.each([
    [ScenarioRunStatus.PASSED, "Passed"],
    [ScenarioRunStatus.FAILED, "Failed"],
    [ScenarioRunStatus.ABORTING, "Aborting"],
    [ScenarioRunStatus.ABORTED, "Aborted"],
    [ScenarioRunStatus.FAILED_TO_ABORT, "Failed To Abort"],
    [ScenarioRunStatus.UNDERWAY, "Underway"],
    [ScenarioRunStatus.READY, "Ready"],
    [ScenarioRunStatus.NA, "N/A"],
  ])("shows '%s' label as '%s'", async (status, expectedLabel) => {
    await renderWithStatus(status);

    expect(screen.getByText(expectedLabel)).toBeTruthy();
  });

  it.each([
    [ScenarioRunStatus.PASSED, "success"],
    [ScenarioRunStatus.FAILED, "danger"],
    [ScenarioRunStatus.ABORTING, "danger"],
    [ScenarioRunStatus.ABORTED, "danger"],
    [ScenarioRunStatus.FAILED_TO_ABORT, "danger"],
    [ScenarioRunStatus.UNDERWAY, "warn"],
    [ScenarioRunStatus.READY, "warn"],
    [ScenarioRunStatus.NA, "secondary"],
  ])("renders '%s' with '%s' severity", async (status, expectedSeverity) => {
    const { fixture } = await renderWithStatus(status);

    const tag = ngMocks.find(fixture, Tag);
    expect(ngMocks.input(tag, "severity")).toBe(expectedSeverity);
  });

  it.each([
    [ScenarioRunStatus.PASSED, "check_circle"],
    [ScenarioRunStatus.FAILED, "cancel"],
    [ScenarioRunStatus.ABORTING, "progress_activity"],
    [ScenarioRunStatus.ABORTED, "power_settings_new"],
    [ScenarioRunStatus.FAILED_TO_ABORT, "cancel"],
    [ScenarioRunStatus.UNDERWAY, "pending"],
    [ScenarioRunStatus.READY, "pending"],
    [ScenarioRunStatus.NA, "remove_circle_outline"],
  ])("renders '%s' with '%s' icon", async (status, expectedIcon) => {
    const { fixture } = await renderWithStatus(status);

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe(expectedIcon);
  });

  it("spins the icon for Aborting status", async () => {
    const { fixture } = await renderWithStatus(ScenarioRunStatus.ABORTING);

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "spin")).toBe(true);
  });

  it("does not spin the icon for Passed status", async () => {
    const { fixture } = await renderWithStatus(ScenarioRunStatus.PASSED);

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "spin")).toBe(false);
  });
});
