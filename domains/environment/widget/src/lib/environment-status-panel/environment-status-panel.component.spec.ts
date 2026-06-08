import { render, screen, waitFor } from "@testing-library/angular";
import { Subject, of } from "rxjs";
import { MockComponent, ngMocks } from "ng-mocks";
import userEvent from "@testing-library/user-event";
import { DialogModule } from "primeng/dialog";
import {
  DateDisplayComponent,
  DurationDisplayComponent,
} from "@mxevolve/shared/ui/primitive";
import {
  EnvironmentStatusDisplayComponent,
  EnvironmentDetailsLinkComponent,
} from "@mxevolve/domains/environment/ui";
import { ConfigureMxTestButtonComponent } from "../configure-mxtest-button/configure-mxtest-button.component";
import { ConnectToDatabaseButtonComponent } from "../connect-to-database-button/connect-to-database-button.component";
import { ServiceActionsButtonComponent } from "../service-actions-button/service-actions-button.component";
import { ConnectApplicativeButtonComponent } from "../connect-applicative-button/connect-applicative-button.component";
import { OpenClientButtonComponent } from "../open-client-button/open-client-button.component";
import { OpenConfigEditorButtonComponent } from "../open-config-editor-button/open-config-editor-button.component";
import { EnvironmentStatusPanelFacade } from "./environment-status-panel-facade";
import { EnvironmentStatusPanelComponent } from "./environment-status-panel.component";
import { EnvironmentStatusPanelData } from "./environment-status-panel-data";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import {
  EnvironmentBundle,
  EnvironmentDatabase,
  EnvironmentIsTool,
} from "@mxevolve/domains/environment/data-access";

const MOCK_IMPORTS = [
  MockComponent(EnvironmentStatusDisplayComponent),
  MockComponent(EnvironmentDetailsLinkComponent),
  MockComponent(DateDisplayComponent),
  MockComponent(DurationDisplayComponent),
  MockComponent(ConfigureMxTestButtonComponent),
  MockComponent(ConnectToDatabaseButtonComponent),
  MockComponent(ServiceActionsButtonComponent),
  MockComponent(ConnectApplicativeButtonComponent),
  MockComponent(OpenClientButtonComponent),
  MockComponent(OpenConfigEditorButtonComponent),
  DialogModule,
];

const mockFacade = {
  fetchPanelData: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "proj-001",
  environmentId: "env-001",
};

const MOCK_DATABASES: EnvironmentDatabase[] = [
  { name: "db-fin", mxDbTypes: ["financial"] },
];

const MOCK_BUNDLES: EnvironmentBundle[] = [
  { id: "mxtestweb", branch: "main", version: "1.0.0", type: "mxtestweb" },
];

const MOCK_IS_TOOLS: EnvironmentIsTool[] = [{ name: "mxtestweb" }];

const MOCK_PANEL_DATA: EnvironmentStatusPanelData = {
  environmentId: "env-001",
  projectId: "proj-001",
  status: EnvironmentStatus.READY,
  deploymentStartDate: "2024-01-01T10:00:00Z",
  deploymentEndDate: "2024-01-01T12:00:00Z",
  terminationMessage: "Deployment complete",
  outputsDirectoryUri: "https://storage/outputs",
  bundles: MOCK_BUNDLES,
  isTools: MOCK_IS_TOOLS,
  databases: MOCK_DATABASES,
  environmentActions: ["MONITOR_SERVICES", "CLIENT"],
  webClientUrl: "https://web.example.com",
  secureClientArtifactUri: "https://secure.example.com/artifact",
};

async function renderComponent(
  inputs: Partial<
    typeof REQUIRED_INPUTS & { showOpenConfigEditorAction: boolean }
  > = {}
) {
  return render(EnvironmentStatusPanelComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: EnvironmentStatusPanelFacade, useValue: mockFacade },
    ],
  });
}

describe("EnvironmentStatusPanelComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFacade.fetchPanelData.mockReturnValue(of(MOCK_PANEL_DATA));
  });

  describe("panel content visibility", () => {
    it("does not render panel content before data loads", async () => {
      const dataSubject = new Subject<EnvironmentStatusPanelData>();
      mockFacade.fetchPanelData.mockReturnValue(dataSubject.asObservable());

      await renderComponent();

      expect(screen.queryByText("Environment")).toBeNull();
    });

    it("renders the panel content after data loads", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("Environment")).toBeTruthy());
    });
  });

  describe("environment label", () => {
    it("renders the Environment label", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("Environment")).toBeTruthy());
    });
  });

  describe("environment status display", () => {
    it("renders the environment status display with the loaded status", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-status-display")
        ).toBeTruthy()
      );

      const statusDisplay = ngMocks.find(
        fixture,
        EnvironmentStatusDisplayComponent
      );
      expect(statusDisplay.componentInstance.status).toBe(
        EnvironmentStatus.READY
      );
    });
  });

  describe("connect-to-database button", () => {
    it("renders the connect-to-database button with the loaded data", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-connect-to-database-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, ConnectToDatabaseButtonComponent);
      expect(button.componentInstance.projectId).toBe(
        MOCK_PANEL_DATA.projectId
      );
      expect(button.componentInstance.environmentId).toBe(
        MOCK_PANEL_DATA.environmentId
      );
      expect(button.componentInstance.databases).toEqual(
        MOCK_PANEL_DATA.databases
      );
      expect(button.componentInstance.status).toBe(MOCK_PANEL_DATA.status);
    });

    it("emits environmentPanelError when a database connection error occurs", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-connect-to-database-button")
        ).toBeTruthy()
      );

      const errorSpy = jest.fn();
      fixture.componentInstance.environmentPanelError.subscribe(errorSpy);

      ngMocks
        .find(fixture, ConnectToDatabaseButtonComponent)
        .componentInstance.connectionError.emit("connection failed");

      await waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith(new Error("connection failed"))
      );
    });
  });

  describe("configure mxtest button", () => {
    it("renders the configure mxtest button with the loaded data", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-configure-mxtest-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, ConfigureMxTestButtonComponent);
      expect(button.componentInstance.projectId).toBe(
        MOCK_PANEL_DATA.projectId
      );
      expect(button.componentInstance.outputsDirectoryUri).toBe(
        MOCK_PANEL_DATA.outputsDirectoryUri
      );
      expect(button.componentInstance.bundles).toEqual(MOCK_PANEL_DATA.bundles);
      expect(button.componentInstance.isTools).toEqual(MOCK_PANEL_DATA.isTools);
      expect(button.componentInstance.status).toBe(MOCK_PANEL_DATA.status);
    });
  });

  describe("open client button", () => {
    it("renders the open client button with the loaded data", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-open-client-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, OpenClientButtonComponent);
      expect(button.componentInstance.projectId).toBe(
        MOCK_PANEL_DATA.projectId
      );
      expect(button.componentInstance.environmentId).toBe(
        MOCK_PANEL_DATA.environmentId
      );
      expect(button.componentInstance.status).toBe(MOCK_PANEL_DATA.status);
      expect(button.componentInstance.environmentActions).toEqual(
        MOCK_PANEL_DATA.environmentActions
      );
      expect(button.componentInstance.webClientUrl).toBe(
        MOCK_PANEL_DATA.webClientUrl
      );
      expect(button.componentInstance.secureClientArtifactUri).toBe(
        MOCK_PANEL_DATA.secureClientArtifactUri
      );
    });
  });

  describe("open config editor action", () => {
    it("does not render the Open Config Editor action by default", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("Environment")).toBeTruthy());
      expect(
        document.querySelector("mxevolve-open-config-editor-button")
      ).toBeNull();
    });

    it("renders the Open Config Editor action when explicitly enabled", async () => {
      const { fixture } = await renderComponent({
        showOpenConfigEditorAction: true,
      });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-open-config-editor-button")
        ).toBeTruthy()
      );

      const button = ngMocks.find(fixture, OpenConfigEditorButtonComponent);
      expect(button.componentInstance.projectId).toBe(
        MOCK_PANEL_DATA.projectId
      );
      expect(button.componentInstance.environmentId).toBe(
        MOCK_PANEL_DATA.environmentId
      );
      expect(button.componentInstance.status).toBe(MOCK_PANEL_DATA.status);
    });
  });

  describe("environment details link", () => {
    it("renders the environment details link with the loaded data", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-environment-details-link")
        ).toBeTruthy()
      );

      const link = ngMocks.find(fixture, EnvironmentDetailsLinkComponent);
      expect(link.componentInstance.projectId).toBe(MOCK_PANEL_DATA.projectId);
      expect(link.componentInstance.environmentId).toBe(
        MOCK_PANEL_DATA.environmentId
      );
    });
  });

  describe("deployment dates and duration", () => {
    it("renders the deployment start date component with the loaded start date", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Deployment Start Date")).toBeTruthy()
      );

      const [startDateDisplay] = ngMocks.findAll(fixture, DateDisplayComponent);
      expect(startDateDisplay.componentInstance.date).toBe(
        MOCK_PANEL_DATA.deploymentStartDate
      );
    });

    it("renders the deployment end date component with the loaded end date", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Deployment End Date")).toBeTruthy()
      );

      const [, endDateDisplay] = ngMocks.findAll(fixture, DateDisplayComponent);
      expect(endDateDisplay.componentInstance.date).toBe(
        MOCK_PANEL_DATA.deploymentEndDate
      );
    });

    it("renders the deployment duration component with the loaded start and end dates", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Deployment Duration")).toBeTruthy()
      );

      const durationDisplay = ngMocks.find(fixture, DurationDisplayComponent);
      expect(durationDisplay.componentInstance.startDate).toBe(
        MOCK_PANEL_DATA.deploymentStartDate
      );
      expect(durationDisplay.componentInstance.endDate).toBe(
        MOCK_PANEL_DATA.deploymentEndDate
      );
    });
  });

  describe("termination message", () => {
    it("renders the full message when it is within the truncation limit", async () => {
      const shortMessage = "A".repeat(80);
      mockFacade.fetchPanelData.mockReturnValue(
        of({ ...MOCK_PANEL_DATA, terminationMessage: shortMessage })
      );

      await renderComponent();

      await waitFor(() => expect(screen.getByText(shortMessage)).toBeTruthy());
    });

    it("does not show the see-more button when the message is within the truncation limit", async () => {
      const shortMessage = "A".repeat(80);
      mockFacade.fetchPanelData.mockReturnValue(
        of({ ...MOCK_PANEL_DATA, terminationMessage: shortMessage })
      );

      await renderComponent();

      await waitFor(() => expect(screen.getByText(shortMessage)).toBeTruthy());
      expect(
        screen.queryByRole("button", { name: "See full termination message" })
      ).toBeNull();
    });

    it("renders a truncated termination message when the message exceeds the truncation limit", async () => {
      const longMessage = "A".repeat(81);
      mockFacade.fetchPanelData.mockReturnValue(
        of({ ...MOCK_PANEL_DATA, terminationMessage: longMessage })
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("A".repeat(80) + "...")).toBeTruthy()
      );
    });

    it("shows the see-more button when the message exceeds the truncation limit", async () => {
      const longMessage = "A".repeat(81);
      mockFacade.fetchPanelData.mockReturnValue(
        of({ ...MOCK_PANEL_DATA, terminationMessage: longMessage })
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "See full termination message" })
        ).toBeTruthy()
      );
    });

    it("renders a dash when there is no termination message", async () => {
      mockFacade.fetchPanelData.mockReturnValue(
        of({ ...MOCK_PANEL_DATA, terminationMessage: undefined })
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Termination Message")).toBeTruthy()
      );
      expect(screen.getByText("-")).toBeTruthy();
    });
  });

  describe("termination message dialog", () => {
    it("opens the dialog with the full message when see more is clicked", async () => {
      const user = userEvent.setup();
      const longMessage = "A".repeat(81);
      mockFacade.fetchPanelData.mockReturnValue(
        of({ ...MOCK_PANEL_DATA, terminationMessage: longMessage })
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "See full termination message" })
        ).toBeTruthy()
      );

      await user.click(
        screen.getByRole("button", { name: "See full termination message" })
      );

      await waitFor(() => expect(screen.getByText(longMessage)).toBeTruthy());
    });
  });

  describe("error handling", () => {
    it("emits environmentPanelError when the facade fails to fetch data", async () => {
      const dataSubject = new Subject<EnvironmentStatusPanelData>();
      mockFacade.fetchPanelData.mockReturnValue(dataSubject.asObservable());

      const { fixture } = await renderComponent();

      const errorSpy = jest.fn();
      fixture.componentInstance.environmentPanelError.subscribe(errorSpy);

      const error = new Error("Fetch failed");
      dataSubject.error(error);

      await waitFor(() => expect(errorSpy).toHaveBeenCalledWith(error));
    });
  });

  describe("[extraActions] projection slot", () => {
    function overrideWithMockProviders(testBed: {
      overrideComponent: (component: unknown, override: unknown) => void;
    }): void {
      testBed.overrideComponent(EnvironmentStatusPanelComponent, {
        set: {
          imports: MOCK_IMPORTS,
          providers: [
            { provide: EnvironmentStatusPanelFacade, useValue: mockFacade },
          ],
        },
      });
    }

    it("renders content projected into the [extraActions] slot", async () => {
      await render(
        `<mxevolve-environment-status-panel
          [projectId]="'proj-001'"
          [environmentId]="'env-001'"
        >
          <button extraActions data-testid="extra-action">Extra</button>
        </mxevolve-environment-status-panel>`,
        {
          imports: [EnvironmentStatusPanelComponent],
          configureTestBed: (testBed) => overrideWithMockProviders(testBed),
        }
      );

      await waitFor(() =>
        expect(screen.getByTestId("extra-action")).toBeTruthy()
      );
    });

    it("renders the panel normally when no [extraActions] content is projected", async () => {
      await renderComponent();

      await waitFor(() => expect(screen.getByText("Environment")).toBeTruthy());
      expect(screen.queryByTestId("extra-action")).toBeNull();
      expect(
        document.querySelector("mxevolve-environment-details-link")
      ).toBeTruthy();
    });
  });
});
