import { render, screen } from "@testing-library/angular";
import { provideRouter } from "@angular/router";
import { EnvironmentNameDisplayComponent } from "./environment-name-display.component";

const REQUIRED_INPUTS = {
  environmentId: "env-1",
  projectId: "project-1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(EnvironmentNameDisplayComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    providers: [provideRouter([])],
  });
}

describe("EnvironmentNameDisplayComponent", () => {
  it("renders a link to the environment details page", async () => {
    await renderComponent();

    expect(screen.getByRole("link", { name: "env-1" })).toHaveAttribute(
      "href",
      "/app/project-1/environments/env-1"
    );
  });

  it("renders the link opening in a new tab", async () => {
    await renderComponent();

    expect(screen.getByRole("link", { name: "env-1" })).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  it("renders plain text when projectId is empty", async () => {
    await renderComponent({ projectId: "" });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("env-1")).toBeTruthy();
  });

  it("renders plain text when environmentId is empty", async () => {
    await renderComponent({ environmentId: "" });

    expect(screen.queryByRole("link")).toBeNull();
  });
});
