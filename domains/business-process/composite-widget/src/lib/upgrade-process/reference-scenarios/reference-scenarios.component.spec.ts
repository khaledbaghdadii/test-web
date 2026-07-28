import { render, screen } from "@testing-library/angular";
import { Button } from "primeng/button";
import { MockComponent, ngMocks } from "ng-mocks";
import { ReferenceScenariosComponent } from "./reference-scenarios.component";
import { ReferenceScenariosTableComponent } from "@mxevolve/domains/business-process/widget";

const MOCK_IMPORTS = [MockComponent(ReferenceScenariosTableComponent), Button];

const REQUIRED_INPUTS = {
  projectId: "project-123",
  referenceScenarioExecutionGroupId: "group-1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ReferenceScenariosComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
  });
}

describe("ReferenceScenariosComponent", () => {
  it("when the component renders, then the Reference Environment title is displayed", async () => {
    await renderComponent();

    expect(screen.getByText("Reference Environment")).toBeTruthy();
  });

  it("when the component renders, then the reference scenarios table is displayed for the current project and reference scenario execution group", async () => {
    const { fixture } = await renderComponent({
      projectId: "project-123",
      referenceScenarioExecutionGroupId: "group-1",
    });

    expect(
      document.querySelector("mxevolve-reference-scenarios-table")
    ).toBeTruthy();
    const table = ngMocks.find(fixture, ReferenceScenariosTableComponent);
    expect(ngMocks.input(table, "projectId")).toBe("project-123");
    expect(ngMocks.input(table, "referenceScenarioExecutionGroupId")).toBe(
      "group-1"
    );
  });
});
