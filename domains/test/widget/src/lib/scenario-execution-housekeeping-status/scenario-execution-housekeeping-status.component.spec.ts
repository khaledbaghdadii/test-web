import { render, screen } from "@testing-library/angular";
import { ScenarioExecutionHousekeepingStatusComponent } from "./scenario-execution-housekeeping-status.component";
import {
  ScenarioExecutionHousekeepingStatus,
  ScenarioExecutionHousekeepingStatusDisplayValue,
} from "@mxevolve/domains/test/model";
import { TagModule } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { MockComponent, ngMocks } from "ng-mocks";

async function renderComponent(
  status: ScenarioExecutionHousekeepingStatus | undefined
) {
  return render(ScenarioExecutionHousekeepingStatusComponent, {
    inputs: { status },
    imports: [TagModule, MockComponent(MxevolveIconComponent)],
  });
}

describe("ScenarioExecutionHousekeepingStatusComponent", () => {
  const cases: {
    status: ScenarioExecutionHousekeepingStatus;
    severity: string;
    icon: string;
  }[] = [
    {
      status: ScenarioExecutionHousekeepingStatus.PASSED,
      severity: "success",
      icon: "cleaning_services",
    },
    {
      status: ScenarioExecutionHousekeepingStatus.FAILED,
      severity: "danger",
      icon: "cleaning_services",
    },
    {
      status: ScenarioExecutionHousekeepingStatus.UNDERWAY,
      severity: "warn",
      icon: "progress_activity",
    },
    {
      status: ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED,
      severity: "secondary",
      icon: "do_not_disturb_on",
    },
    {
      status: ScenarioExecutionHousekeepingStatus.SCHEDULED_FOR_CLEANING,
      severity: "info",
      icon: "schedule",
    },
  ];

  it.each(cases)(
    "should render $status status with $severity severity",
    async ({ status, severity }) => {
      const { fixture } = await renderComponent(status);
      const tag = fixture.nativeElement.querySelector(`.p-tag-${severity}`);
      expect(tag).toBeTruthy();
    }
  );

  it.each(cases)(
    "should display correct label for $status status",
    async ({ status }) => {
      await renderComponent(status);
      expect(
        screen.getByText(
          ScenarioExecutionHousekeepingStatusDisplayValue[status]
        )
      ).toBeTruthy();
    }
  );

  it.each(cases)(
    "should render $icon icon for $status status",
    async ({ status, icon }) => {
      const { fixture } = await renderComponent(status);
      const iconComponent = ngMocks.find(fixture, MxevolveIconComponent);
      expect(ngMocks.input(iconComponent, "name")).toBe(icon);
    }
  );
});
