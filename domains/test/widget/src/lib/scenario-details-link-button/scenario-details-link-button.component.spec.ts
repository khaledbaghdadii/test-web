import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent } from "ng-mocks";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ScenarioDetailsLinkButtonComponent } from "./scenario-details-link-button.component";

async function renderComponent(
  inputs: { projectId: string; scenarioRunId: string; disabled?: boolean } = {
    projectId: "proj-001",
    scenarioRunId: "run-001",
  }
) {
  return render(ScenarioDetailsLinkButtonComponent, {
    imports: [MockComponent(MxevolveIconComponent)],
    inputs: {
      disabled: false,
      ...inputs,
    },
  });
}

describe("ScenarioDetailsLinkButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the scenario details button", async () => {
    await renderComponent();

    expect(
      screen.getByRole("button", { name: "Open scenario details" })
    ).toBeTruthy();
  });

  it("has a Scenario details tooltip on the button", async () => {
    await renderComponent();
    const user = userEvent.setup();

    await user.hover(
      screen.getByRole("button", { name: "Open scenario details" })
    );

    await waitFor(() => {
      expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
        "Scenario details"
      );
    });
  });

  it("opens the scenario details page in a new tab for the given run", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    await renderComponent({
      projectId: "proj-001",
      scenarioRunId: "run-555",
    });

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Open scenario details" })
    );

    expect(openSpy).toHaveBeenCalledWith(
      "/app/proj-001/test/execution/details/run-555",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("disables the button when disabled input is true", async () => {
    await renderComponent({
      projectId: "proj-001",
      scenarioRunId: "run-555",
      disabled: true,
    });

    expect(
      screen.getByRole("button", { name: "Open scenario details" })
    ).toBeDisabled();
  });

  it("does not open the scenario details page when disabled", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    await renderComponent({
      projectId: "proj-001",
      scenarioRunId: "run-555",
      disabled: true,
    });

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Open scenario details" })
    );

    expect(openSpy).not.toHaveBeenCalled();
  });
});
