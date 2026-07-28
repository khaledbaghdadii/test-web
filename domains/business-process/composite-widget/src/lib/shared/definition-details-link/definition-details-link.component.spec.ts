import { render, screen } from "@testing-library/angular";
import { provideRouter } from "@angular/router";
import { BusinessProcessDefinition } from "@mxevolve/domains/business-process/data-access";
import { DefinitionDetailsLinkComponent } from "./definition-details-link.component";

function definition(
  overrides: Partial<BusinessProcessDefinition> = {}
): BusinessProcessDefinition {
  return {
    id: "def-1",
    name: "Master Validation",
    providedInputs: [],
    ...overrides,
  };
}

async function renderLink(overrides: Partial<BusinessProcessDefinition> = {}) {
  return render(DefinitionDetailsLinkComponent, {
    inputs: {
      projectId: "project-1",
      definition: definition(overrides),
    },
    providers: [provideRouter([])],
  });
}

describe("DefinitionDetailsLinkComponent", () => {
  it("shows the definition's name as the link text", async () => {
    await renderLink({ name: "Master Validation" });

    expect(
      screen.getByRole("link", { name: "Master Validation" })
    ).toBeTruthy();
  });

  it("builds the router link from the project and definition ids", async () => {
    await renderLink({ id: "def-42" });

    const link = screen.getByRole("link", { name: "Master Validation" });

    expect(link.getAttribute("href")).toBe(
      "/app/project-1/business-process/definition/details/def-42"
    );
  });

  it("opens the link in a new tab without leaking a window reference", async () => {
    await renderLink();

    const link = screen.getByRole("link", { name: "Master Validation" });

    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
