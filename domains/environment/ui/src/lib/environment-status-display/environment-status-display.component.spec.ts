import { render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { EnvironmentStatusDisplayComponent } from "./environment-status-display.component";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

const MOCK_IMPORTS = [MockComponent(MxevolveIconComponent), Tag];

async function renderWithStatus(status: EnvironmentStatus) {
  return render(EnvironmentStatusDisplayComponent, {
    inputs: { status },
    componentImports: MOCK_IMPORTS,
  });
}

describe("EnvironmentStatusDisplayComponent", () => {
  it.each([
    [EnvironmentStatus.CREATED, "Created"],
    [EnvironmentStatus.CONFIG_VALID, "Config Valid"],
    [EnvironmentStatus.READY, "Ready"],
    [EnvironmentStatus.CONFIG_INVALID, "Config Invalid"],
    [EnvironmentStatus.PREPARATION_FAILED, "Preparation Failed"],
    [EnvironmentStatus.BROKEN, "Broken"],
    [EnvironmentStatus.PREPARING, "Preparing"],
    [EnvironmentStatus.EXECUTING, "Executing"],
    [EnvironmentStatus.CLEANING, "Cleaning"],
    [EnvironmentStatus.CLEANED, "Cleaned"],
    [EnvironmentStatus.CLEAN_FAILED, "Clean Failed"],
  ])("shows '%s' label as '%s'", async (status, expectedLabel) => {
    await renderWithStatus(status);

    expect(screen.getByText(expectedLabel)).toBeTruthy();
  });

  it.each([
    [EnvironmentStatus.CREATED, "success"],
    [EnvironmentStatus.CONFIG_VALID, "success"],
    [EnvironmentStatus.READY, "success"],
    [EnvironmentStatus.CONFIG_INVALID, "danger"],
    [EnvironmentStatus.PREPARATION_FAILED, "danger"],
    [EnvironmentStatus.BROKEN, "danger"],
    [EnvironmentStatus.PREPARING, "info"],
    [EnvironmentStatus.EXECUTING, "info"],
    [EnvironmentStatus.CLEANING, "secondary"],
    [EnvironmentStatus.CLEANED, "secondary"],
    [EnvironmentStatus.CLEAN_FAILED, "danger"],
  ])("renders '%s' with '%s' severity", async (status, expectedSeverity) => {
    const { fixture } = await renderWithStatus(status);

    const tag = ngMocks.find(fixture, Tag);
    expect(ngMocks.input(tag, "severity")).toBe(expectedSeverity);
  });

  it.each([
    [EnvironmentStatus.CREATED, "check_circle"],
    [EnvironmentStatus.CONFIG_VALID, "check_circle"],
    [EnvironmentStatus.READY, "check_circle"],
    [EnvironmentStatus.CONFIG_INVALID, "cancel"],
    [EnvironmentStatus.PREPARATION_FAILED, "cancel"],
    [EnvironmentStatus.BROKEN, "cancel"],
    [EnvironmentStatus.PREPARING, "access_time"],
    [EnvironmentStatus.EXECUTING, "access_time"],
    [EnvironmentStatus.CLEANING, "access_time"],
    [EnvironmentStatus.CLEANED, "cleaning_services"],
    [EnvironmentStatus.CLEAN_FAILED, "cleaning_services"],
  ])("renders '%s' with '%s' icon", async (status, expectedIcon) => {
    const { fixture } = await renderWithStatus(status);

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe(expectedIcon);
  });

  it("renders the tag as rounded", async () => {
    const { fixture } = await renderWithStatus(EnvironmentStatus.READY);

    const tag = ngMocks.find(fixture, Tag);
    expect(ngMocks.input(tag, "rounded")).toBe(true);
  });
});
