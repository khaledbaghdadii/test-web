import { render, screen } from "@testing-library/angular";
import { MockComponent } from "ng-mocks";
import { ButtonModule } from "primeng/button";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { EnvironmentDetailsLinkComponent } from "./environment-details-link.component";

const MOCK_IMPORTS = [MockComponent(MxevolveIconComponent), ButtonModule];

async function renderComponent(
  inputs: Partial<{ projectId: string; environmentId: string }> = {}
) {
  return render(EnvironmentDetailsLinkComponent, {
    imports: MOCK_IMPORTS,
    inputs: {
      projectId: "project-1",
      environmentId: "env-1",
      ...inputs,
    },
  });
}

describe("EnvironmentDetailsLinkComponent", () => {
  it("renders the Details button", async () => {
    await renderComponent();

    expect(screen.getByRole("link", { name: /details/i })).toBeTruthy();
  });

  it("links to the environment details page for the given project and environment", async () => {
    await renderComponent({ projectId: "proj-42", environmentId: "env-99" });

    const link = screen.getByRole("link", { name: /details/i });
    expect(link.getAttribute("href")).toBe("/app/proj-42/environments/env-99");
  });

  it("opens the details link in a new tab", async () => {
    await renderComponent();

    const link = screen.getByRole("link", { name: /details/i });
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("sets rel=noopener noreferrer on the details link", async () => {
    await renderComponent();

    const link = screen.getByRole("link", { name: /details/i });
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
