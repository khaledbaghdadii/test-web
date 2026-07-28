import { render, screen, waitFor } from "@testing-library/angular";
import { provideRouter, RouterLink } from "@angular/router";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { Tag } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import {
  CommitIdDisplayComponent,
  CopyToClipboardComponent,
  ExpandableMessageComponent,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import {
  Environment,
  ManagementRequest,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { EnvironmentDetailsInfoComponent } from "./environment-details-info.component";
import { PanelModule } from "primeng/panel";

const MOCK_IMPORTS = [
  RouterLink,
  Tag,
  Tooltip,
  MockComponent(CommitIdDisplayComponent),
  CopyToClipboardComponent,
  ExpandableMessageComponent,
  MxevolveIconComponent,
];

const MOCK_ENVIRONMENT: Environment = {
  id: "env-uuid-001",
  projectId: "proj-001",
  status: EnvironmentStatus.READY,
  databases: [],
  environmentDefinition: { id: "def-1", name: "My Environment" },
  environmentDeploymentMode: "VANILLA",
  configurationIdentifier: { branch: "feature/x", revision: "abcdef123456" },
  maintenance: { full: true },
  allocationId: "alloc-uuid-123",
};

async function renderComponent(
  environment: Environment = MOCK_ENVIRONMENT,
  latestRequest?: ManagementRequest
) {
  return render(EnvironmentDetailsInfoComponent, {
    imports: [PanelModule],
    inputs: { environment, projectId: "proj-001", latestRequest },
    componentImports: MOCK_IMPORTS,
    providers: [provideRouter([])],
  });
}

describe("EnvironmentDetailsInfoComponent", () => {
  it("renders the environment id", async () => {
    await renderComponent();

    expect(screen.getByText("env-uuid-001")).toBeTruthy();
  });

  it("renders a copy button for the environment id", async () => {
    const { fixture } = await renderComponent();

    const copyButtons = ngMocks.findInstances(
      fixture,
      CopyToClipboardComponent
    );
    expect(
      copyButtons.some((button) => button.value() === "env-uuid-001")
    ).toBe(true);
  });

  it("renders the environment definition name", async () => {
    await renderComponent();

    expect(screen.getByText("My Environment")).toBeTruthy();
  });

  it("renders the deployment source text", async () => {
    await renderComponent();

    expect(screen.getByText("VANILLA")).toBeTruthy();
  });

  it("renders the deployment source tooltip details", async () => {
    const { fixture } = await renderComponent();

    const tooltips = ngMocks.findInstances(fixture, Tooltip);
    expect(
      tooltips.some(
        (tooltip) =>
          tooltip.content === "The database is loaded from the dump files"
      )
    ).toBe(true);
  });

  it("renders the POOL deployment source details", async () => {
    await renderComponent({
      ...MOCK_ENVIRONMENT,
      environmentSource: "POOL",
      environmentDeploymentMode: undefined,
    });

    expect(screen.getByText("POOL")).toBeTruthy();
  });

  it("renders the branch", async () => {
    await renderComponent();

    expect(screen.getByText("feature/x")).toBeTruthy();
  });

  it("forwards the revision to the commit id display", async () => {
    const { fixture } = await renderComponent();

    const commitId = ngMocks.find(fixture, CommitIdDisplayComponent);
    expect(ngMocks.input(commitId, "commitId")).toBe("abcdef123456");
  });

  it("renders the full maintenance label", async () => {
    await renderComponent();

    expect(screen.getByText("full")).toBeTruthy();
  });

  it("renders the custom maintenance label", async () => {
    await renderComponent({
      ...MOCK_ENVIRONMENT,
      maintenance: { full: false },
    });

    expect(screen.getByText("custom")).toBeTruthy();
  });

  it("renders the infra allocation link", async () => {
    await renderComponent();

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/app/proj-001/infra/allocations/alloc-uuid-123"
    );
  });

  it("renders a copy button for the allocation id", async () => {
    const { fixture } = await renderComponent();

    const copyButtons = ngMocks.findInstances(
      fixture,
      CopyToClipboardComponent
    );
    expect(
      copyButtons.some((button) => button.value() === "alloc-uuid-123")
    ).toBe(true);
  });

  it("should render a dash when no infra allocation is present", async () => {
    await renderComponent({ ...MOCK_ENVIRONMENT, allocationId: undefined });

    expect(screen.getByTestId("infra-allocation-dash")).toBeTruthy();
  });

  it("does not render an error reason when there is no latest request", async () => {
    await renderComponent();

    expect(screen.queryByText("Error Reason")).toBeNull();
  });

  it("renders the error reason from an ended request result message", async () => {
    await renderComponent(MOCK_ENVIRONMENT, {
      id: "req-1",
      type: "DEPLOYMENT",
      status: "ENDED",
      createdOn: "2024-01-01T00:00:00Z",
      resultMessage: "Deployment failed",
    });

    expect(screen.getByText("Deployment failed")).toBeTruthy();
  });

  it("renders the error reason from a non-ended request status message", async () => {
    await renderComponent(MOCK_ENVIRONMENT, {
      id: "req-1",
      type: "DEPLOYMENT",
      status: "EXECUTING",
      createdOn: "2024-01-01T00:00:00Z",
      statusMessage: "Still running",
    });

    expect(screen.getByText("Still running")).toBeTruthy();
  });

  it("opens the dialog with the full error reason when see more is clicked", async () => {
    const longMessage = "x".repeat(120);
    await renderComponent(MOCK_ENVIRONMENT, {
      id: "req-1",
      type: "DEPLOYMENT",
      status: "ENDED",
      createdOn: "2024-01-01T00:00:00Z",
      resultMessage: longMessage,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "See full error reason" })
    );

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent(longMessage)
    );
  });
});
