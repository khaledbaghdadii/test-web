import { render, screen } from "@testing-library/angular";
import { MockDirective, ngMocks } from "ng-mocks";
import { RouterLink } from "@angular/router";
import { ScenarioRunNameDisplayComponent } from "./scenario-run-name-display.component";

const MOCK_IMPORTS = [MockDirective(RouterLink)];

async function renderWith(inputs: {
  name: string;
  scenarioRunId: string;
  projectId: string;
}) {
  return render(ScenarioRunNameDisplayComponent, {
    inputs,
    componentImports: MOCK_IMPORTS,
  });
}

describe("ScenarioRunNameDisplayComponent", () => {
  it("renders the name as a link when project id and scenario run id are provided", async () => {
    const { fixture } = await renderWith({
      name: "My Scenario",
      scenarioRunId: "run-1",
      projectId: "proj-1",
    });

    const link = ngMocks.find(fixture, "a");
    expect(link.nativeElement.textContent.trim()).toBe("My Scenario");
    expect(ngMocks.input(link, "routerLink")).toBe(
      "/app/proj-1/test/execution/details/run-1"
    );
  });

  it("renders the name as plain text when project id is empty", async () => {
    await renderWith({
      name: "My Scenario",
      scenarioRunId: "run-1",
      projectId: "",
    });

    expect(screen.getByText("My Scenario")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders the name as plain text when scenario run id is empty", async () => {
    await renderWith({
      name: "My Scenario",
      scenarioRunId: "",
      projectId: "proj-1",
    });

    expect(screen.getByText("My Scenario")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
