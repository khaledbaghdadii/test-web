import { render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import { EnvironmentActionsPanelComponent } from "./environment-actions-panel.component";
import { EnvironmentActionsTableComponent } from "../environment-actions-table/environment-actions-table.component";
import { Panel } from "primeng/panel";

const MOCK_REQUESTS: ManagementRequest[] = [
  {
    id: "req-1",
    type: "Deployment",
    status: "ENDED",
    createdOn: "2026-03-01T10:00:00Z",
  },
];

async function renderComponent(requests: ManagementRequest[] = MOCK_REQUESTS) {
  return render(EnvironmentActionsPanelComponent, {
    inputs: {
      projectId: "proj-001",
      environmentId: "env-001",
      requests,
    },
    componentImports: [Panel, MockComponent(EnvironmentActionsTableComponent)],
  });
}

describe("EnvironmentActionsPanelComponent", () => {
  it("renders the Environment Actions header", async () => {
    await renderComponent();

    expect(screen.getByText("Environment Requests")).toBeTruthy();
  });

  it("renders the environment actions table", async () => {
    const { fixture } = await renderComponent();

    expect(
      ngMocks.find(fixture, EnvironmentActionsTableComponent)
    ).toBeTruthy();
  });

  it("forwards the project id to the actions table", async () => {
    const { fixture } = await renderComponent();

    const table = ngMocks.find(fixture, EnvironmentActionsTableComponent);
    expect(ngMocks.input(table, "projectId")).toBe("proj-001");
  });

  it("forwards the environment id to the actions table", async () => {
    const { fixture } = await renderComponent();

    const table = ngMocks.find(fixture, EnvironmentActionsTableComponent);
    expect(ngMocks.input(table, "environmentId")).toBe("env-001");
  });

  it("forwards the requests to the actions table", async () => {
    const { fixture } = await renderComponent();

    const table = ngMocks.find(fixture, EnvironmentActionsTableComponent);
    expect(ngMocks.input(table, "requests")).toEqual(MOCK_REQUESTS);
  });
});
