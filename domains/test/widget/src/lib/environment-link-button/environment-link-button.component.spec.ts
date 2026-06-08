import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent } from "ng-mocks";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { RouterLink, provideRouter } from "@angular/router";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { EnvironmentLinkButtonComponent } from "./environment-link-button.component";

const MOCK_IMPORTS = [
  MockComponent(MxevolveIconComponent),
  Button,
  TooltipModule,
  RouterLink,
];

const REQUIRED_INPUTS = {
  projectId: "project-123",
  environmentId: "env-456",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(EnvironmentLinkButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    providers: [provideRouter([])],
  });
}

describe("EnvironmentLinkButtonComponent", () => {
  it("renders a button with environment details aria label", async () => {
    await renderComponent();

    expect(
      screen.getByRole("button", { name: "View environment details" })
    ).toBeInTheDocument();
  });

  it("wraps the button in a link to the environment page", async () => {
    await renderComponent();

    const button = screen.getByRole("button", {
      name: "View environment details",
    });
    const link = button.closest("a");
    expect(link).toHaveAttribute(
      "href",
      "/app/project-123/environments/env-456"
    );
  });

  it("renders the storage icon inside the button", async () => {
    await renderComponent();

    const button = screen.getByRole("button", {
      name: "View environment details",
    });
    const icon = button.querySelector("mxevolve-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("name", "storage");
  });

  it("has an Environment Details tooltip on the button", async () => {
    await renderComponent();
    const user = userEvent.setup();

    await user.hover(
      screen.getByRole("button", { name: "View environment details" })
    );

    await waitFor(() => {
      expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
        "Environment Details"
      );
    });
  });
});
