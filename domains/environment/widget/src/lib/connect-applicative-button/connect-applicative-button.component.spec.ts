import { render, screen, waitFor } from "@testing-library/angular";
import { Subject, of, throwError } from "rxjs";
import { MockComponent } from "ng-mocks";
import userEvent from "@testing-library/user-event";
import { NgTemplateOutlet } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TieredMenu } from "primeng/tieredmenu";
import { TooltipModule } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  ApplicationConnectionService,
  Applicative,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { ConnectApplicativeButtonComponent } from "./connect-applicative-button.component";
import { PuttyConfigurationDialogComponent } from "./putty-configuration-dialog.component";

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

const mockApplicationConnectionService = {
  fetchSshConnectionUrl: jest.fn(),
  fetchScpConnectionUrl: jest.fn(),
};

const MOCK_PRIMARY_APPLICATIVE: Applicative = {
  allocation: { machine: { id: "machine-1", name: "app-host-1" } },
  directory: "/opt/murex/app",
};

const MOCK_SECONDARY_APPLICATIVE: Applicative = {
  allocation: { machine: { id: "machine-2", name: "app-host-2" } },
  directory: "/opt/murex/app2",
};

const REQUIRED_INPUTS = {
  projectId: "proj-001",
  environmentId: "env-001",
  status: EnvironmentStatus.READY,
  primaryApplicative: MOCK_PRIMARY_APPLICATIVE as Applicative | undefined,
  secondaryApplicatives: [] as Applicative[],
  iconOnly: false,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ConnectApplicativeButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: [
      ButtonModule,
      TieredMenu,
      TooltipModule,
      NgTemplateOutlet,
      MockComponent(MxevolveIconComponent),
      MockComponent(PuttyConfigurationDialogComponent),
    ],
    componentProviders: [
      {
        provide: ApplicationConnectionService,
        useValue: mockApplicationConnectionService,
      },
    ],
  });
}

describe("ConnectApplicativeButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "open").mockImplementation(() => null);
    mockApplicationConnectionService.fetchSshConnectionUrl.mockReturnValue(
      of({ connectionUrl: "ssh://app-host-1.example.com" })
    );
    mockApplicationConnectionService.fetchScpConnectionUrl.mockReturnValue(
      of({ connectionUrl: "scp://app-host-1.example.com" })
    );
  });

  describe("button visibility", () => {
    it("renders the Connect Applicative button when primary applicative exists", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: /Connect Applicative/ })
      ).toBeTruthy();
    });

    it("disables button when primary applicative is undefined", async () => {
      await renderComponent({ primaryApplicative: undefined });

      expect(
        screen.getByRole("button", { name: /Connect Applicative/ })
      ).toBeDisabled();
    });
  });

  describe("button disabled state", () => {
    it("enables the button when status is READY", async () => {
      await renderComponent({ status: EnvironmentStatus.READY });

      expect(
        screen.getByRole("button", { name: /Connect Applicative/ })
      ).not.toBeDisabled();
    });

    it("enables the button when status is BROKEN", async () => {
      await renderComponent({ status: EnvironmentStatus.BROKEN });

      expect(
        screen.getByRole("button", { name: /Connect Applicative/ })
      ).not.toBeDisabled();
    });

    it("disables the button when status is PREPARING", async () => {
      await renderComponent({ status: EnvironmentStatus.PREPARING });

      expect(
        screen.getByRole("button", { name: /Connect Applicative/ })
      ).toBeDisabled();
    });
  });

  describe("single applicative menu", () => {
    it("shows hostname as parent menu item for single applicative", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );

      await waitFor(() => expect(screen.getByText("app-host-1")).toBeTruthy());
    });
  });

  describe("multiple applicatives menu", () => {
    it("shows hostname items for multiple applicatives", async () => {
      const user = userEvent.setup();
      await renderComponent({
        secondaryApplicatives: [MOCK_SECONDARY_APPLICATIVE],
      });

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );

      await waitFor(() => expect(screen.getByText("app-host-2")).toBeTruthy());
    });
  });

  describe("SSH connection", () => {
    it("opens SSH connection URL in new tab when Connect SSH is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );
      await user.hover(await screen.findByText("app-host-1"));
      await user.click(await screen.findByText("Connect SSH"));

      await waitFor(() =>
        expect(window.open).toHaveBeenCalledWith(
          "ssh://app-host-1.example.com",
          "_blank"
        )
      );
    });

    it("emits connectionError when SSH connection fails", async () => {
      mockApplicationConnectionService.fetchSshConnectionUrl.mockReturnValue(
        throwError(() => new Error("Network failure"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const connectionErrorSpy = jest.fn();
      fixture.componentInstance.connectionError.subscribe(connectionErrorSpy);

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );
      await user.hover(await screen.findByText("app-host-1"));
      await user.click(await screen.findByText("Connect SSH"));

      await waitFor(() =>
        expect(connectionErrorSpy).toHaveBeenCalledWith(expect.any(Error))
      );
    });
  });

  describe("SCP connection", () => {
    it("opens SCP connection URL in new tab when Connect WinSCP is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );
      await user.hover(await screen.findByText("app-host-1"));
      await user.click(await screen.findByText("Connect WinSCP"));

      await waitFor(() =>
        expect(window.open).toHaveBeenCalledWith(
          "scp://app-host-1.example.com",
          "_blank"
        )
      );
    });

    it("emits connectionError when SCP connection fails", async () => {
      mockApplicationConnectionService.fetchScpConnectionUrl.mockReturnValue(
        throwError(() => new Error("Network failure"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const connectionErrorSpy = jest.fn();
      fixture.componentInstance.connectionError.subscribe(connectionErrorSpy);

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );
      await user.hover(await screen.findByText("app-host-1"));
      await user.click(await screen.findByText("Connect WinSCP"));

      await waitFor(() =>
        expect(connectionErrorSpy).toHaveBeenCalledWith(expect.any(Error))
      );
    });
  });

  describe("loading state", () => {
    it("shows loading state while connection is in progress", async () => {
      const connectionSubject = new Subject<{ connectionUrl: string }>();
      mockApplicationConnectionService.fetchSshConnectionUrl.mockReturnValue(
        connectionSubject
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );
      await user.hover(await screen.findByText("app-host-1"));
      await user.click(await screen.findByText("Connect SSH"));

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /Connect Applicative/ })
        ).toBeDisabled()
      );
    });
  });

  describe("PuTTY configuration", () => {
    it("opens PuTTY configuration dialog when settings icon is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );
      await user.hover(await screen.findByText("app-host-1"));

      const settingsIcon = await screen.findByTestId("ssh-settings-icon");
      await user.click(settingsIcon);

      expect(fixture.componentInstance.puttyConfigurationDialogVisible()).toBe(
        true
      );
    });

    it("closes the menu when settings icon is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: /Connect Applicative/ })
      );
      await user.hover(await screen.findByText("app-host-1"));

      const settingsIcon = await screen.findByTestId("ssh-settings-icon");
      await user.click(settingsIcon);

      await waitFor(() => {
        expect(screen.queryByText("Connect SSH")).not.toBeInTheDocument();
        expect(screen.queryByText("Connect WinSCP")).not.toBeInTheDocument();
      });
    });
  });

  describe("iconOnly mode", () => {
    it("renders a labeled button when iconOnly is false", async () => {
      await renderComponent({ iconOnly: false });

      expect(
        screen.getByRole("button", { name: /Connect Applicative/ })
      ).toBeTruthy();
    });

    it("does not show visible button text in icon-only mode", async () => {
      await renderComponent({ iconOnly: true });

      expect(screen.queryByText("Connect Applicative")).toBeNull();
    });

    it("shows 'Connect Applicative' tooltip on hover in icon-only mode", async () => {
      const user = userEvent.setup();
      await renderComponent({ iconOnly: true });

      await user.hover(
        screen.getByRole("button", { name: "Connect Applicative" })
      );

      await waitFor(() => {
        expect(screen.getByText("Connect Applicative")).toBeInTheDocument();
      });
    });
  });
});
