import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/data-access";
import { PreviouslyLinkedDetectionToggleComponent } from "./previously-linked-detection-toggle.component";

const analyticsTrackerService = {
  trackPreviouslyLinkedAnalysisObjectToggle: jest.fn(),
};

async function renderComponent(
  analysisObjectType = AnalysisObjectType.BINARY_IMPACT
) {
  return render(PreviouslyLinkedDetectionToggleComponent, {
    inputs: { analysisObjectType },
    providers: [
      {
        provide: TestManagementAnalyticsTrackerService,
        useValue: analyticsTrackerService,
      },
    ],
  });
}

describe("PreviouslyLinkedDetectionToggleComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create", async () => {
    await renderComponent();

    expect(
      screen.getByTestId("previously-linked-detection-toggle")
    ).toBeTruthy();
  });

  it("should default to showing all detections", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Previously linked Binary Impacts" })
      ).not.toHaveClass("p-togglebutton-checked");
      expect(
        screen.getByRole("button", { name: "All Binary Impacts" })
      ).toHaveClass("p-togglebutton-checked");
    });
  });

  it.each([
    [AnalysisObjectType.BINARY_IMPACT, "Binary Impacts"],
    [AnalysisObjectType.BINARY_REGRESSION, "Binary Regressions"],
    [AnalysisObjectType.CONFIGURATION_IMPACT, "Configuration Impacts"],
    [AnalysisObjectType.CONFIGURATION_REGRESSION, "Configuration Regressions"],
    [AnalysisObjectType.FAILURE_REASON, "Reason of Failures"],
    [AnalysisObjectType.INCIDENT, "Incidents"],
  ])(
    "should render the button options for %s",
    async (analysisObjectType, displayName) => {
      await renderComponent(analysisObjectType);

      expect(
        screen.getByRole("button", { name: `All ${displayName}` })
      ).toBeTruthy();
      expect(
        screen.getByRole("button", {
          name: `Previously linked ${displayName}`,
        })
      ).toBeTruthy();
    }
  );

  it("should select the previously linked option when clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Previously linked Binary Impacts" })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Previously linked Binary Impacts" })
      ).toHaveClass("p-togglebutton-checked");
      expect(
        screen.getByRole("button", { name: "All Binary Impacts" })
      ).not.toHaveClass("p-togglebutton-checked");
    });
  });

  it("should update the show previously linked model with the current button selection state", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Previously linked Binary Impacts" })
    );
    await waitFor(() =>
      expect(fixture.componentInstance.showPreviouslyLinked()).toBe(true)
    );

    await user.click(
      screen.getByRole("button", { name: "All Binary Impacts" })
    );
    await waitFor(() =>
      expect(fixture.componentInstance.showPreviouslyLinked()).toBe(false)
    );
  });

  it("should track the analysis object type and selected state when the toggle changes", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Previously linked Binary Impacts" })
    );

    expect(
      analyticsTrackerService.trackPreviouslyLinkedAnalysisObjectToggle
    ).toHaveBeenCalledWith(AnalysisObjectType.BINARY_IMPACT);
  });

  it("should not track when the filter is switched back to all", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Previously linked Binary Impacts" })
    );

    jest.resetAllMocks();
    await user.click(
      screen.getByRole("button", { name: "All Binary Impacts" })
    );

    expect(
      analyticsTrackerService.trackPreviouslyLinkedAnalysisObjectToggle
    ).not.toHaveBeenCalled();
  });

  it("should not deselect the current option when it is clicked again", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(
      screen.getByRole("button", { name: "All Binary Impacts" })
    );

    await waitFor(() =>
      expect(fixture.componentInstance.showPreviouslyLinked()).toBe(false)
    );
  });
});
