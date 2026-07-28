import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { ModuleRegistry } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { Environment } from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { EnvironmentResourcesTabsComponent } from "./environment-resources-tabs.component";
import { PanelModule } from "primeng/panel";
import { TabsModule } from "primeng/tabs";

ModuleRegistry.registerModules([AllEnterpriseModule]);

const MOCK_ENVIRONMENT: Environment = {
  id: "env-001",
  projectId: "proj-001",
  status: EnvironmentStatus.READY,
  databases: [
    {
      name: "db-fin",
      mxDbTypes: ["financial"],
      allocation: {
        name: "dbserver",
        port: "3306",
        machine: { name: "db-host" },
      },
    },
  ],
  primaryApplicative: {
    allocation: {
      machine: { id: "m1", name: "app-host" },
      ports: { start: 8000, end: 8100 },
    },
    directory: "/opt/app",
  },
  secondaryApplicatives: [
    {
      allocation: {
        machine: { id: "m2", name: "secondary-host" },
        ports: { start: 9000, end: 9100 },
      },
      directory: "/opt/secondary",
    },
  ],
  clients: [
    {
      directory: "/opt/client",
      allocation: { machine: { name: "client-host" } },
    },
  ],
  tests: [
    {
      directory: "/opt/tests",
      allocation: { machine: { name: "tests-host" } },
    },
  ],
  bundles: [
    { id: "CORE", branch: "9.24", version: "9.24.1", changelist: "67890" },
  ],
};

async function renderComponent(environment: Environment = MOCK_ENVIRONMENT) {
  return render(EnvironmentResourcesTabsComponent, {
    inputs: { environment },
    imports: [TabsModule, PanelModule],
  });
}

describe("EnvironmentResourcesTabsComponent", () => {
  it("renders the Applications tab header", async () => {
    await renderComponent();

    expect(screen.getByRole("tab", { name: "Applications" })).toBeTruthy();
  });

  it("renders the Database tab header", async () => {
    await renderComponent();

    expect(screen.getByRole("tab", { name: "Databases" })).toBeTruthy();
  });

  it("renders the Client tab header", async () => {
    await renderComponent();

    expect(screen.getByRole("tab", { name: "Clients" })).toBeTruthy();
  });

  it("renders the Tests tab header", async () => {
    await renderComponent();

    expect(screen.getByRole("tab", { name: "Tests" })).toBeTruthy();
  });

  it("renders the Bundles tab header", async () => {
    await renderComponent();

    expect(screen.getByRole("tab", { name: "Bundles" })).toBeTruthy();
  });

  it("should open applications tab by default", async () => {
    await renderComponent();

    expect(await screen.findByText("app-host")).toBeTruthy();
  });

  it("shows application rows when the Applications tab is opened", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole("tab", { name: "Applications" }));

    expect(await screen.findByText("app-host")).toBeTruthy();
  });

  it("shows the database server details when the Database tab is opened", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole("tab", { name: "Databases" }));

    expect(await screen.findByText("dbserver")).toBeTruthy();
  });

  it("shows the client directory when the Client tab is opened", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole("tab", { name: "Clients" }));

    expect(await screen.findByText("/opt/client")).toBeTruthy();
  });

  it("shows the bundle revision when the Bundles tab is opened", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole("tab", { name: "Bundles" }));

    expect(await screen.findByText("67890")).toBeTruthy();
  });

  it("does not render any action buttons inside the tabs", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole("tab", { name: "Applications" }));

    expect(screen.queryByRole("button", { name: /connect/i })).toBeNull();
  });
});
