import { render, screen, waitFor } from "@testing-library/angular";
import { of, throwError } from "rxjs";
import { MockComponent } from "ng-mocks";
import userEvent from "@testing-library/user-event";
import { Confirmation, ConfirmationService } from "primeng/api";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ToggleSwitch } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";
import { TieredMenu } from "primeng/tieredmenu";
import { FormsModule } from "@angular/forms";
import { NgTemplateOutlet } from "@angular/common";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { ServiceActionsService } from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { ServiceActionsButtonComponent } from "./service-actions-button.component";
import { ViewEnvironmentServicesDialogComponent } from "./view-environment-services-dialog.component";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

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

const mockServiceActionsService = {
  startEnvironment: jest.fn(),
  stopEnvironment: jest.fn(),
  fetchEnvironmentServices: jest.fn(),
  excludeFromDailyShutdown: jest.fn(),
};

const mockConfirmationService = {
  confirm: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  clearErrors: jest.fn(),
};

const mockFeatureFlagResolver = {
  isFeatureEnabled: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "proj-001",
  environmentId: "env-001",
  status: EnvironmentStatus.READY,
  excludeFromShutdown: false,
  environmentActions: ["MONITOR_SERVICES"],
  iconOnly: false,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ServiceActionsButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: [
      ButtonModule,
      TieredMenu,
      NgTemplateOutlet,
      MockComponent(ConfirmDialog),
      ToggleSwitch,
      FormsModule,
      TooltipModule,
      MockComponent(MxevolveIconComponent),
      MockComponent(ViewEnvironmentServicesDialogComponent),
    ],
    componentProviders: [
      { provide: ConfirmationService, useValue: mockConfirmationService },
      {
        provide: ServiceActionsService,
        useValue: mockServiceActionsService,
      },
      { provide: FeatureFlagResolver, useValue: mockFeatureFlagResolver },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

function getAcceptCallback(): () => void {
  const confirmation = mockConfirmationService.confirm.mock
    .calls[0][0] as Confirmation;
  return confirmation.accept as () => void;
}

describe("ServiceActionsButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceActionsService.startEnvironment.mockReturnValue(
      of({ startRequestId: "123" })
    );
    mockServiceActionsService.stopEnvironment.mockReturnValue(
      of({ stopRequestId: "456" })
    );
    mockServiceActionsService.excludeFromDailyShutdown.mockReturnValue(
      of(undefined)
    );
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);
  });

  describe("button rendering", () => {
    it("renders the Services button", async () => {
      await renderComponent();

      expect(screen.getByRole("button", { name: /Services/ })).toBeTruthy();
    });
  });

  describe("button disabled state", () => {
    it("keeps the button enabled when status is not READY so the menu remains accessible", async () => {
      await renderComponent({ status: EnvironmentStatus.BROKEN });

      expect(
        screen.getByRole("button", { name: /Services/ })
      ).not.toBeDisabled();
    });

    it("keeps the button enabled when status is READY", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: /Services/ })
      ).not.toBeDisabled();
    });
  });

  describe("menu items", () => {
    it("shows Start, Stop, and View menu items when menu is opened", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: /Services/ }));

      await waitFor(() => {
        expect(screen.getByText("Start")).toBeTruthy();
      });
    });
  });

  describe("start action", () => {
    it("opens confirm dialog when Start is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: /Services/ }));
      await user.click(await screen.findByTestId("menu-item-start"));

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "service-actions-confirm",
          header: "Start Environment Services",
        })
      );
    });

    it("calls startEnvironment when confirmation is accepted", async () => {
      const { fixture } = await renderComponent();

      fixture.componentInstance.handleStart();
      getAcceptCallback()();

      expect(mockServiceActionsService.startEnvironment).toHaveBeenCalledWith(
        "proj-001",
        "env-001"
      );
    });

    it("shows success toast after successful start", async () => {
      const { fixture } = await renderComponent();

      fixture.componentInstance.handleStart();
      getAcceptCallback()();

      await waitFor(() => {
        expect(mockToastService.showSuccess).toHaveBeenCalledWith(
          "Environment services start request submitted successfully"
        );
      });
    });

    it("shows error toast when start fails", async () => {
      mockServiceActionsService.startEnvironment.mockReturnValue(
        throwError(() => new Error("Start failed"))
      );
      const { fixture } = await renderComponent();

      fixture.componentInstance.handleStart();
      getAcceptCallback()();

      await waitFor(() => {
        expect(mockToastService.showError).toHaveBeenCalledWith("Start failed");
      });
    });
  });

  describe("stop action", () => {
    it("opens confirm dialog when Stop is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: /Services/ }));
      await user.click(await screen.findByTestId("menu-item-stop"));

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "service-actions-confirm",
          header: "Stop Environment Services",
        })
      );
    });

    it("calls stopEnvironment when confirmation is accepted", async () => {
      const { fixture } = await renderComponent();

      fixture.componentInstance.handleStop();
      getAcceptCallback()();

      expect(mockServiceActionsService.stopEnvironment).toHaveBeenCalledWith(
        "proj-001",
        "env-001"
      );
    });

    it("shows success toast after successful stop", async () => {
      const { fixture } = await renderComponent();

      fixture.componentInstance.handleStop();
      getAcceptCallback()();

      await waitFor(() => {
        expect(mockToastService.showSuccess).toHaveBeenCalledWith(
          "Environment services stop request submitted successfully"
        );
      });
    });

    it("shows error toast when stop fails", async () => {
      mockServiceActionsService.stopEnvironment.mockReturnValue(
        throwError(() => new Error("Stop failed"))
      );
      const { fixture } = await renderComponent();

      fixture.componentInstance.handleStop();
      getAcceptCallback()();

      await waitFor(() => {
        expect(mockToastService.showError).toHaveBeenCalledWith("Stop failed");
      });
    });
  });

  describe("view action", () => {
    it("opens the services dialog when View is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(screen.getByRole("button", { name: /Services/ }));
      await user.click(await screen.findByTestId("menu-item-view"));

      expect(fixture.componentInstance.viewServicesDialogVisible()).toBe(true);
    });
  });

  describe("toggle shutdown", () => {
    it("shows the shutdown toggle when the feature flag is enabled", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: /Services/ }));

      expect(await screen.findByText("Start")).toBeTruthy();
      expect(
        await screen.findByText("Exclude from daily shutdown")
      ).toBeTruthy();
    });

    it("hides the shutdown toggle when the feature flag is disabled", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: /Services/ }));

      expect(await screen.findByText("Start")).toBeTruthy();

      await waitFor(() => {
        expect(screen.queryByText("Exclude from daily shutdown")).toBeNull();
      });
    });

    it("calls excludeFromDailyShutdown when toggle is changed", async () => {
      const user = userEvent.setup();
      await renderComponent({ excludeFromShutdown: true });

      await user.click(screen.getByRole("button", { name: /Services/ }));
      await user.click(
        await screen.findByRole("switch", {
          name: "Include in daily shutdown",
        })
      );

      expect(
        mockServiceActionsService.excludeFromDailyShutdown
      ).toHaveBeenCalledWith("proj-001", "env-001", false);
    });

    it("shows success toast and emits environmentChanged after successful toggle", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({ excludeFromShutdown: true });
      const envChangedSpy = jest.fn();
      fixture.componentInstance.environmentChanged.subscribe(envChangedSpy);

      await user.click(screen.getByRole("button", { name: /Services/ }));
      await user.click(
        await screen.findByRole("switch", {
          name: "Include in daily shutdown",
        })
      );

      await waitFor(() => {
        expect(mockToastService.showSuccess).toHaveBeenCalledWith(
          "Environment included in daily shutdown"
        );
        expect(envChangedSpy).toHaveBeenCalled();
      });
    });

    it("shows error toast when toggle fails", async () => {
      mockServiceActionsService.excludeFromDailyShutdown.mockReturnValue(
        throwError(() => new Error("Toggle failed"))
      );
      const user = userEvent.setup();
      await renderComponent({ excludeFromShutdown: true });

      await user.click(screen.getByRole("button", { name: /Services/ }));
      await user.click(
        await screen.findByRole("switch", {
          name: "Include in daily shutdown",
        })
      );

      await waitFor(() => {
        expect(mockToastService.showError).toHaveBeenCalledWith(
          "Toggle failed"
        );
      });
    });
  });

  describe("view disabled state", () => {
    it("disables View when MONITOR_SERVICES is not in environmentActions", async () => {
      const { fixture } = await renderComponent({
        environmentActions: [],
      });

      expect(fixture.componentInstance.viewDisabled()).toBe(true);
    });

    it("disables View when status is not READY", async () => {
      const { fixture } = await renderComponent({
        status: EnvironmentStatus.BROKEN,
        environmentActions: ["MONITOR_SERVICES"],
      });

      expect(fixture.componentInstance.viewDisabled()).toBe(true);
    });
  });

  describe("view tooltip", () => {
    it("shows not-ready tooltip on disabled View item when hovered", async () => {
      const user = userEvent.setup();
      await renderComponent({
        status: EnvironmentStatus.BROKEN,
        environmentActions: ["MONITOR_SERVICES"],
      });

      await user.click(screen.getByRole("button", { name: /Services/ }));
      const viewItem = await screen.findByTestId("menu-item-view");
      await user.hover(viewItem);

      await waitFor(() => {
        expect(
          screen.getByText("Environment is not in a ready state.")
        ).toBeTruthy();
      });
    });

    it("shows version tooltip when MONITOR_SERVICES is missing", async () => {
      const user = userEvent.setup();
      await renderComponent({
        status: EnvironmentStatus.READY,
        environmentActions: [],
      });

      await user.click(screen.getByRole("button", { name: /Services/ }));
      const viewItem = await screen.findByTestId("menu-item-view");
      await user.hover(viewItem);

      await waitFor(() => {
        expect(
          screen.getByText("Functionality available starting from v3.1.63.")
        ).toBeTruthy();
      });
    });

    it("does not show tooltip when View is enabled", async () => {
      const user = userEvent.setup();
      await renderComponent({
        status: EnvironmentStatus.READY,
        environmentActions: ["MONITOR_SERVICES"],
      });

      await user.click(screen.getByRole("button", { name: /Services/ }));
      const viewItem = await screen.findByTestId("menu-item-view");
      await user.hover(viewItem);

      expect(
        screen.queryByText("Environment is not in a ready state.")
      ).toBeNull();
      expect(
        screen.queryByText("Functionality available starting from v3.1.63.")
      ).toBeNull();
    });
  });

  describe("iconOnly mode", () => {
    it("renders a labeled button when iconOnly is false", async () => {
      await renderComponent();

      expect(screen.getByRole("button", { name: /Services/ })).toBeTruthy();
    });

    it("does not show visible button text in icon-only mode", async () => {
      await renderComponent({ iconOnly: true });

      expect(screen.queryByText("Services")).toBeNull();
    });

    it("shows 'Services' tooltip on hover in icon-only mode", async () => {
      const user = userEvent.setup();
      await renderComponent({ iconOnly: true });

      await user.hover(screen.getByRole("button", { name: "Services" }));

      await waitFor(() => {
        expect(screen.getByText("Services")).toBeInTheDocument();
      });
    });
  });
});
