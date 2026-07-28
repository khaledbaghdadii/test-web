import { render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { Divider } from "primeng/divider";
import { EnvironmentStatusDisplayComponent } from "@mxevolve/domains/environment/ui";
import { Environment } from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { EnvironmentDetailsHeaderComponent } from "./environment-details-header.component";
import { EnvironmentCleanButtonComponent } from "../clean-button/clean-button.component";
import { EnvironmentAbortButtonComponent } from "../abort-button/abort-button.component";
import { ServiceActionsButtonComponent } from "../service-actions-button/service-actions-button.component";
import { OpenClientButtonComponent } from "../open-client-button/open-client-button.component";
import { ConnectToDatabaseButtonComponent } from "../connect-to-database-button/connect-to-database-button.component";
import { ConnectApplicativeButtonComponent } from "../connect-applicative-button/connect-applicative-button.component";
import { ConfigureMxTestButtonComponent } from "../configure-mxtest-button/configure-mxtest-button.component";
import { EnvironmentShutdownPolicyToggleComponent } from "../shutdown-policy-toggle/shutdown-policy-toggle.component";

const MOCK_IMPORTS = [
  Divider,
  MockComponent(EnvironmentStatusDisplayComponent),
  MockComponent(EnvironmentCleanButtonComponent),
  MockComponent(EnvironmentAbortButtonComponent),
  MockComponent(ServiceActionsButtonComponent),
  MockComponent(OpenClientButtonComponent),
  MockComponent(ConnectToDatabaseButtonComponent),
  MockComponent(ConnectApplicativeButtonComponent),
  MockComponent(ConfigureMxTestButtonComponent),
  MockComponent(EnvironmentShutdownPolicyToggleComponent),
];

const MOCK_ENVIRONMENT: Environment = {
  id: "env-001",
  projectId: "proj-001",
  status: EnvironmentStatus.READY,
  databases: [{ name: "db-fin", mxDbTypes: ["financial"] }],
  environmentDefinition: { id: "def-1", name: "My Environment" },
  allocationId: "alloc-123",
  excludeFromShutdown: false,
  environmentActions: ["CLIENT"],
};

async function renderComponent(environment: Environment = MOCK_ENVIRONMENT) {
  return render(EnvironmentDetailsHeaderComponent, {
    inputs: { environment, projectId: "proj-001" },
    componentImports: MOCK_IMPORTS,
  });
}

describe("EnvironmentDetailsHeaderComponent", () => {
  it("renders the environment definition name in bold", async () => {
    await renderComponent();

    expect(screen.getByTestId("environment-name")).toHaveClass("font-bold");
  });

  it("renders the environment definition name text", async () => {
    await renderComponent();

    expect(screen.getByText("My Environment")).toBeTruthy();
  });

  it("falls back to a dash when there is no environment definition", async () => {
    await renderComponent({
      ...MOCK_ENVIRONMENT,
      environmentDefinition: undefined,
    });

    expect(screen.getByTestId("environment-name").textContent?.trim()).toBe(
      "-"
    );
  });

  it("renders the environment status display with the environment status", async () => {
    const { fixture } = await renderComponent();

    const statusDisplay = ngMocks.find(
      fixture,
      EnvironmentStatusDisplayComponent
    );
    expect(ngMocks.input(statusDisplay, "status")).toBe(
      EnvironmentStatus.READY
    );
  });

  it("renders the clean button", async () => {
    const { fixture } = await renderComponent();

    expect(ngMocks.find(fixture, EnvironmentCleanButtonComponent)).toBeTruthy();
  });

  it("renders the abort button", async () => {
    const { fixture } = await renderComponent();

    expect(ngMocks.find(fixture, EnvironmentAbortButtonComponent)).toBeTruthy();
  });

  it("renders a divider between the two rows", async () => {
    const { fixture } = await renderComponent();

    expect(ngMocks.find(fixture, Divider)).toBeTruthy();
  });

  it("renders the service actions button", async () => {
    const { fixture } = await renderComponent();

    expect(ngMocks.find(fixture, ServiceActionsButtonComponent)).toBeTruthy();
  });

  it("renders the open client button", async () => {
    const { fixture } = await renderComponent();

    expect(ngMocks.find(fixture, OpenClientButtonComponent)).toBeTruthy();
  });

  it("forwards the environment status to the open client button", async () => {
    const { fixture } = await renderComponent({
      ...MOCK_ENVIRONMENT,
      status: EnvironmentStatus.BROKEN,
    });

    const button = ngMocks.find(fixture, OpenClientButtonComponent);
    expect(ngMocks.input(button, "status")).toBe(EnvironmentStatus.BROKEN);
  });

  it("renders the connect to database button", async () => {
    const { fixture } = await renderComponent();

    expect(
      ngMocks.find(fixture, ConnectToDatabaseButtonComponent)
    ).toBeTruthy();
  });

  it("renders the connect applicative button", async () => {
    const { fixture } = await renderComponent();

    expect(
      ngMocks.find(fixture, ConnectApplicativeButtonComponent)
    ).toBeTruthy();
  });

  it("renders the configure mxtest button", async () => {
    const { fixture } = await renderComponent();

    expect(ngMocks.find(fixture, ConfigureMxTestButtonComponent)).toBeTruthy();
  });

  it("renders the WRP toggle with the allocation id", async () => {
    const { fixture } = await renderComponent();

    const toggle = ngMocks.find(
      fixture,
      EnvironmentShutdownPolicyToggleComponent
    );
    expect(ngMocks.input(toggle, "allocationId")).toBe("alloc-123");
  });

  it("does not render the WRP toggle when there is no allocation id", async () => {
    const { fixture } = await renderComponent({
      ...MOCK_ENVIRONMENT,
      allocationId: undefined,
    });

    expect(
      ngMocks.findInstances(fixture, EnvironmentShutdownPolicyToggleComponent)
    ).toHaveLength(0);
  });

  it("emits changed when the clean button reports a clean", async () => {
    const { fixture } = await renderComponent();
    const changedSpy = jest.fn();
    fixture.componentInstance.changed.subscribe(changedSpy);

    ngMocks
      .find(fixture, EnvironmentCleanButtonComponent)
      .componentInstance.cleaned.emit();

    expect(changedSpy).toHaveBeenCalled();
  });

  it("emits changed when the abort button reports an abort", async () => {
    const { fixture } = await renderComponent();
    const changedSpy = jest.fn();
    fixture.componentInstance.changed.subscribe(changedSpy);

    ngMocks
      .find(fixture, EnvironmentAbortButtonComponent)
      .componentInstance.aborted.emit();

    expect(changedSpy).toHaveBeenCalled();
  });

  it("emits an error when a database connection error occurs", async () => {
    const { fixture } = await renderComponent();
    const errorSpy = jest.fn();
    fixture.componentInstance.panelError.subscribe(errorSpy);

    ngMocks
      .find(fixture, ConnectToDatabaseButtonComponent)
      .componentInstance.connectionError.emit("db down");

    expect(errorSpy).toHaveBeenCalledWith(new Error("db down"));
  });

  it("emits an error when an applicative connection error occurs", async () => {
    const { fixture } = await renderComponent();
    const errorSpy = jest.fn();
    fixture.componentInstance.panelError.subscribe(errorSpy);

    const error = new Error("ssh failed");
    ngMocks
      .find(fixture, ConnectApplicativeButtonComponent)
      .componentInstance.connectionError.emit(error);

    expect(errorSpy).toHaveBeenCalledWith(error);
  });
});
