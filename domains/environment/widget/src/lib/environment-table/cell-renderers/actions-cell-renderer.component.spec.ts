import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import userEvent from "@testing-library/user-event";
import { ButtonModule } from "primeng/button";
import { Popover } from "primeng/popover";
import { Tooltip } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { Environment } from "@mxevolve/domains/environment/data-access";
import { EnvironmentDetailsLinkComponent } from "@mxevolve/domains/environment/ui";
import { OpenClientButtonComponent } from "../../open-client-button/open-client-button.component";
import { ServiceActionsButtonComponent } from "../../service-actions-button/service-actions-button.component";
import { ConnectApplicativeButtonComponent } from "../../connect-applicative-button/connect-applicative-button.component";
import { ConnectToDatabaseButtonComponent } from "../../connect-to-database-button/connect-to-database-button.component";
import { ConfigureMxTestButtonComponent } from "../../configure-mxtest-button/configure-mxtest-button.component";
import {
  ActionsCellRendererComponent,
  ActionsCellRendererParams,
} from "./actions-cell-renderer.component";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const MOCK_IMPORTS = [
  ButtonModule,
  Popover,
  Tooltip,
  MockComponent(MxevolveIconComponent),
  MockComponent(OpenClientButtonComponent),
  MockComponent(ServiceActionsButtonComponent),
  MockComponent(ConnectApplicativeButtonComponent),
  MockComponent(ConnectToDatabaseButtonComponent),
  MockComponent(ConfigureMxTestButtonComponent),
  MockComponent(EnvironmentDetailsLinkComponent),
];

const MOCK_ENVIRONMENT: Environment = {
  id: "env-001",
  status: EnvironmentStatus.READY,
  projectId: "proj-001",
  databases: [{ name: "main-db", mxDbTypes: ["financial"] }],
  outputsDirectoryUri: "https://storage/outputs",
  bundles: [{ id: "mxtestweb", branch: "main", version: "1.0.0" }],
  isTools: [{ name: "mxtestweb" }],
  primaryApplicative: { allocation: {}, directory: "/app" },
  secondaryApplicatives: [],
  excludeFromShutdown: false,
  environmentActions: ["CLIENT", "MONITOR_SERVICES"],
  webClientUrl: "https://web.example.com",
  secureClientArtifactUri: "https://secure.example.com/artifact",
};

async function renderComponent(
  environment: Partial<Environment> = {},
  projectId = "proj-001"
) {
  const result = await render(ActionsCellRendererComponent, {
    componentImports: MOCK_IMPORTS,
  });
  result.fixture.componentInstance.agInit({
    data: { ...MOCK_ENVIRONMENT, ...environment },
    projectId,
  } as ActionsCellRendererParams);
  result.fixture.detectChanges();
  return result;
}

describe("ActionsCellRendererComponent", () => {
  describe("inline open-client button", () => {
    it("renders with correct inputs", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-open-client-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, OpenClientButtonComponent);
      expect(button.componentInstance.iconOnly).toBe(true);
      expect(button.componentInstance.projectId).toBe("proj-001");
      expect(button.componentInstance.environmentId).toBe(MOCK_ENVIRONMENT.id);
      expect(button.componentInstance.status).toBe(MOCK_ENVIRONMENT.status);
      expect(button.componentInstance.environmentActions).toEqual(
        MOCK_ENVIRONMENT.environmentActions
      );
      expect(button.componentInstance.webClientUrl).toBe(
        MOCK_ENVIRONMENT.webClientUrl
      );
      expect(button.componentInstance.secureClientArtifactUri).toBe(
        MOCK_ENVIRONMENT.secureClientArtifactUri
      );
    });
  });

  describe("inline service-actions button", () => {
    it("renders with correct inputs", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-service-actions-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, ServiceActionsButtonComponent);
      expect(button.componentInstance.iconOnly).toBe(true);
      expect(button.componentInstance.projectId).toBe("proj-001");
      expect(button.componentInstance.environmentId).toBe(MOCK_ENVIRONMENT.id);
      expect(button.componentInstance.status).toBe(MOCK_ENVIRONMENT.status);
      expect(button.componentInstance.excludeFromShutdown).toBe(
        MOCK_ENVIRONMENT.excludeFromShutdown
      );
      expect(button.componentInstance.environmentActions).toEqual(
        MOCK_ENVIRONMENT.environmentActions
      );
    });
  });

  describe("inline connect-applicative button", () => {
    it("renders with correct inputs", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-connect-applicative-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, ConnectApplicativeButtonComponent);
      expect(button.componentInstance.iconOnly).toBe(true);
      expect(button.componentInstance.projectId).toBe("proj-001");
      expect(button.componentInstance.environmentId).toBe(MOCK_ENVIRONMENT.id);
      expect(button.componentInstance.status).toBe(MOCK_ENVIRONMENT.status);
      expect(button.componentInstance.primaryApplicative).toBe(
        MOCK_ENVIRONMENT.primaryApplicative
      );
      expect(button.componentInstance.secondaryApplicatives).toEqual(
        MOCK_ENVIRONMENT.secondaryApplicatives
      );
    });
  });

  describe("more actions button", () => {
    it("renders the More actions button", async () => {
      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "More actions" })
        ).toBeTruthy()
      );
    });

    it("shows More actions tooltip on hover", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.hover(
        await screen.findByRole("button", { name: "More actions" })
      );

      await waitFor(() =>
        expect(screen.getByText("More actions")).toBeTruthy()
      );
    });
  });

  describe("menu connect-to-database button", () => {
    it("renders with correct inputs", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(
        await screen.findByRole("button", { name: "More actions" })
      );

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-connect-to-database-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, ConnectToDatabaseButtonComponent);
      expect(button.componentInstance.projectId).toBe("proj-001");
      expect(button.componentInstance.environmentId).toBe(MOCK_ENVIRONMENT.id);
      expect(button.componentInstance.databases).toEqual(
        MOCK_ENVIRONMENT.databases
      );
      expect(button.componentInstance.status).toBe(MOCK_ENVIRONMENT.status);
    });
  });

  describe("menu configure-mxtest button", () => {
    it("renders with correct inputs", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(
        await screen.findByRole("button", { name: "More actions" })
      );

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-configure-mxtest-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, ConfigureMxTestButtonComponent);
      expect(button.componentInstance.projectId).toBe("proj-001");
      expect(button.componentInstance.status).toBe(MOCK_ENVIRONMENT.status);
      expect(button.componentInstance.outputsDirectoryUri).toBe(
        MOCK_ENVIRONMENT.outputsDirectoryUri
      );
      expect(button.componentInstance.bundles).toEqual(
        MOCK_ENVIRONMENT.bundles
      );
      expect(button.componentInstance.isTools).toEqual(
        MOCK_ENVIRONMENT.isTools
      );
    });
  });

  describe("menu details link", () => {
    it("renders with correct inputs", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(
        await screen.findByRole("button", { name: "More actions" })
      );

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-details-link")
        ).toBeTruthy()
      );

      const link = ngMocks.find(fixture, EnvironmentDetailsLinkComponent);
      expect(link.componentInstance.projectId).toBe("proj-001");
      expect(link.componentInstance.environmentId).toBe(MOCK_ENVIRONMENT.id);
    });
  });

  describe("cell renderer lifecycle", () => {
    it("returns false from refresh to prevent cell re-render", async () => {
      const { fixture } = await renderComponent();

      expect(fixture.componentInstance.refresh()).toBe(false);
    });
  });
});
