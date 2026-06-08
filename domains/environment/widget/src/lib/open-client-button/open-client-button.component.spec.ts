import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import {
  EnvironmentService,
  MXClientDetails,
} from "@mxevolve/domains/environment/data-access";
import { OpenClientButtonComponent } from "./open-client-button.component";
import { MxenvCompanionService } from "./mxenv-companion.service";

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

const MOCK_CLIENT_DETAILS: MXClientDetails = {
  environmentId: "env-001",
  host: "host.example.com",
  port: 8080,
  clientJar: { type: "ARTIFACT", name: "my-jar", uri: "https://jar-uri" },
  clientPackage: {
    type: "PACKAGE",
    name: "my-package",
    uri: "https://package-uri",
  },
};

const REQUIRED_INPUTS = {
  projectId: "proj-001",
  environmentId: "env-001",
  status: EnvironmentStatus.READY,
};

const mockEnvironmentService = {
  getMXClientDetails: jest.fn(),
};

const mockCompanionService = {
  callCompanionUrl: jest.fn(),
  callSecureCompanionUrl: jest.fn(),
  launchWebClient: jest.fn(),
};

const mockToastService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    environmentId: string;
    status: EnvironmentStatus;
    environmentActions: string[];
    webClientUrl: string | undefined;
    secureClientArtifactUri: string | undefined;
    iconOnly: boolean;
  }> = {}
) {
  return render(OpenClientButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: MxenvCompanionService, useValue: mockCompanionService },
    ],
    providers: [
      { provide: EnvironmentService, useValue: mockEnvironmentService },
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
}

function getMainButton(label: RegExp) {
  return screen.getByRole("button", { name: label });
}

function getMenuItemLink(name: string) {
  const menuItem = screen.getByRole("menuitem", { name });
  return menuItem.querySelector("a")!;
}

describe("OpenClientButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvironmentService.getMXClientDetails.mockReturnValue(
      of(MOCK_CLIENT_DETAILS)
    );
  });

  describe("label", () => {
    it("shows 'Open Web Client' when WEB_CLIENT action is present", async () => {
      await renderComponent({
        environmentActions: ["WEB_CLIENT"],
        webClientUrl: "https://web.example.com",
      });

      expect(getMainButton(/Open Web Client/)).toBeInTheDocument();
    });

    it("shows 'Open MX.3 Client TLS' when SECURE_CLIENT is present without WEB_CLIENT", async () => {
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: "https://secure.example.com",
      });

      expect(getMainButton(/Open MX.3 Client TLS/)).toBeInTheDocument();
    });

    it("shows 'Open MX.3 Client' when neither WEB_CLIENT nor SECURE_CLIENT is present", async () => {
      await renderComponent({
        environmentActions: [],
      });

      expect(getMainButton(/Open MX.3 Client/)).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("is disabled when status is not READY", async () => {
      await renderComponent({
        status: EnvironmentStatus.PREPARING,
      });

      expect(getMainButton(/Open MX.3 Client/)).toBeDisabled();
    });

    it("is enabled when status is READY", async () => {
      await renderComponent({
        status: EnvironmentStatus.READY,
      });

      expect(getMainButton(/Open MX.3 Client/)).not.toBeDisabled();
    });

    it("is disabled when SECURE_CLIENT but no URI and no web client fallback", async () => {
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: undefined,
      });

      expect(getMainButton(/Open MX.3 Client TLS/)).toBeDisabled();
    });

    it("is disabled when SECURE_CLIENT has no URI and WEB_CLIENT has no URL", async () => {
      await renderComponent({
        environmentActions: ["WEB_CLIENT", "SECURE_CLIENT"],
        webClientUrl: undefined,
        secureClientArtifactUri: undefined,
      });

      expect(getMainButton(/Open Web Client/)).toBeDisabled();
    });

    it("is enabled when SECURE_CLIENT has no URI but WEB_CLIENT has a URL", async () => {
      await renderComponent({
        environmentActions: ["WEB_CLIENT", "SECURE_CLIENT"],
        webClientUrl: "https://web.example.com",
        secureClientArtifactUri: undefined,
      });

      expect(getMainButton(/Open Web Client/)).not.toBeDisabled();
    });

    it("becomes disabled after a purged build error", async () => {
      mockEnvironmentService.getMXClientDetails.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({ status: 400, statusText: "Bad Request" })
        )
      );
      const user = userEvent.setup();
      await renderComponent({ environmentActions: [] });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client"));

      await waitFor(() => {
        expect(getMainButton(/Open MX.3 Client/)).toBeDisabled();
      });
    });
  });

  describe("tooltip", () => {
    it("shows 'Web client is not available' when WEB_CLIENT has no URL", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["WEB_CLIENT"],
        webClientUrl: undefined,
      });

      await user.hover(getMainButton(/Open Web Client/));

      await waitFor(() => {
        expect(
          screen.getByText("Web client is not available")
        ).toBeInTheDocument();
      });
    });

    it("shows 'TLS client is not available' when SECURE_CLIENT has no URI", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: undefined,
      });

      await user.hover(getMainButton(/Open MX.3 Client TLS/));

      await waitFor(() => {
        expect(
          screen.getByText("TLS client is not available")
        ).toBeInTheDocument();
      });
    });

    it("shows combined message when both web URL and TLS URI are missing", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["WEB_CLIENT", "SECURE_CLIENT"],
        webClientUrl: undefined,
        secureClientArtifactUri: undefined,
      });

      await user.hover(getMainButton(/Open Web Client/));

      await waitFor(() => {
        expect(
          screen.getByText("Web client and TLS clients are not available")
        ).toBeInTheDocument();
      });
    });

    it("does not show a tooltip when all client URLs are available", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["WEB_CLIENT"],
        webClientUrl: "https://web.example.com",
      });

      await user.hover(getMainButton(/Open Web Client/));

      expect(document.querySelector(".p-tooltip")).toBeNull();
    });

    it("shows purged build message after a 400 error", async () => {
      mockEnvironmentService.getMXClientDetails.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({ status: 400, statusText: "Bad Request" })
        )
      );
      const user = userEvent.setup();
      await renderComponent({ environmentActions: [] });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client"));

      await waitFor(() => {
        expect(getMainButton(/Open MX.3 Client/)).toBeDisabled();
      });

      await user.unhover(getMainButton(/Open MX.3 Client/));
      await user.hover(getMainButton(/Open MX.3 Client/));

      await waitFor(() => {
        expect(
          screen.getByText(
            "The build ID is purged, please make sure to generate new MX.3 setups and to deploy a new environment"
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("default action in menu", () => {
    it("shows the default action as a disabled menu item when WEB_CLIENT has no URL", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["WEB_CLIENT"],
        webClientUrl: undefined,
      });

      await user.click(getMainButton(/Open Web Client/));

      await waitFor(() => {
        const menuItem = screen.getByRole("menuitem", {
          name: "Open Web Client",
        });
        expect(menuItem).toHaveClass("p-disabled");
      });
    });

    it("shows the default action as a disabled menu item when SECURE_CLIENT has no URI", async () => {
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: undefined,
      });

      expect(getMainButton(/Open MX.3 Client TLS/)).toBeDisabled();
    });

    it("does not disable the button for regular client", async () => {
      await renderComponent({
        environmentActions: [],
      });

      expect(getMainButton(/Open MX.3 Client/)).not.toBeDisabled();
    });
  });

  describe("menu items", () => {
    it("shows TLS menu items when SECURE_CLIENT and URI are present", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: "https://secure.example.com",
      });

      await user.click(getMainButton(/Open MX.3 Client TLS/));

      await waitFor(() => {
        expect(screen.getByText("MX.3 Client TLS")).toBeInTheDocument();
        expect(screen.getByText("Monitor Services TLS")).toBeInTheDocument();
        expect(screen.getByText("Rich Client TLS")).toBeInTheDocument();
        expect(screen.getByText("Browse TLS Client Repo")).toBeInTheDocument();
      });
    });

    it("shows regular menu items when SECURE_CLIENT is not present", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: [],
      });

      await user.click(getMainButton(/Open MX.3 Client/));

      await waitFor(() => {
        expect(screen.getByText("MX.3 Client")).toBeInTheDocument();
        expect(screen.getByText("Monitor Services")).toBeInTheDocument();
        expect(screen.getByText("Rich Client")).toBeInTheDocument();
        expect(screen.getByText("Browse Client Repo")).toBeInTheDocument();
      });
    });

    it("includes the default action as the first menu item", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: "https://secure.example.com",
      });

      await user.click(getMainButton(/Open MX.3 Client TLS/));

      await waitFor(() => {
        const items = screen.getAllByRole("menuitem");
        expect(items[0]).toHaveTextContent("Open MX.3 Client TLS");
      });
    });
  });

  describe("launching web client", () => {
    it("opens the web client URL when clicking the menu item", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["WEB_CLIENT"],
        webClientUrl: "https://web.example.com",
      });

      await user.click(getMainButton(/Open Web Client/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open Web Client" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open Web Client"));

      expect(mockCompanionService.launchWebClient).toHaveBeenCalledWith(
        "https://web.example.com"
      );
    });
  });

  describe("launching secure client", () => {
    it("navigates to the secure companion URL with client_tls launcher", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: "https://secure.example.com",
      });

      await user.click(getMainButton(/Open MX.3 Client TLS/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client TLS" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client TLS"));

      expect(mockCompanionService.callSecureCompanionUrl).toHaveBeenCalledWith({
        environmentId: "env-001",
        launcher: "client_tls",
        secureClientArtifactUri: "https://secure.example.com",
      });
    });

    it("does not fetch client details from the API", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: "https://secure.example.com",
      });

      await user.click(getMainButton(/Open MX.3 Client TLS/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client TLS" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client TLS"));

      expect(mockEnvironmentService.getMXClientDetails).not.toHaveBeenCalled();
    });

    it("navigates to the secure companion URL for Monitor Services TLS menu item", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: "https://secure.example.com",
      });

      await user.click(getMainButton(/Open MX.3 Client TLS/));
      await waitFor(() => {
        expect(screen.getByText("Monitor Services TLS")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Monitor Services TLS"));

      expect(mockCompanionService.callSecureCompanionUrl).toHaveBeenCalledWith({
        environmentId: "env-001",
        launcher: "monit_tls",
        secureClientArtifactUri: "https://secure.example.com",
      });
    });
  });

  describe("launching regular client", () => {
    it("fetches client details and navigates to the companion URL", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: [],
      });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client"));

      expect(mockEnvironmentService.getMXClientDetails).toHaveBeenCalledWith(
        "proj-001",
        "env-001"
      );
      expect(mockCompanionService.callCompanionUrl).toHaveBeenCalledWith({
        environmentId: "env-001",
        launcher: "client",
        host: "host.example.com",
        port: 8080,
        clientPackageName: "my-package",
        clientPackageUri: "https://package-uri",
        clientJarName: "my-jar",
        clientJarUri: "https://jar-uri",
      });
    });

    it("uses the correct launcher for Monitor Services menu item", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: [],
      });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(screen.getByText("Monitor Services")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Monitor Services"));

      expect(mockCompanionService.callCompanionUrl).toHaveBeenCalledWith(
        expect.objectContaining({ launcher: "monit" })
      );
    });

    it("uses empty launcher for Browse Client Repo menu item", async () => {
      const user = userEvent.setup();
      await renderComponent({
        environmentActions: [],
      });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(screen.getByText("Browse Client Repo")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Browse Client Repo"));

      expect(mockCompanionService.callCompanionUrl).toHaveBeenCalledWith(
        expect.objectContaining({ launcher: "" })
      );
    });
  });

  describe("error handling", () => {
    it("shows a purged build error toast on 400 response", async () => {
      mockEnvironmentService.getMXClientDetails.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({ status: 400, statusText: "Bad Request" })
        )
      );
      const user = userEvent.setup();
      await renderComponent({ environmentActions: [] });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client"));

      await waitFor(() => {
        expect(mockToastService.showError).toHaveBeenCalledWith(
          "The build ID is purged, please make sure to generate new MX.3 setups and to deploy a new environment",
          "Error while opening client"
        );
      });
    });

    it("shows the server error message on non-400 response", async () => {
      mockEnvironmentService.getMXClientDetails.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              statusText: "Internal Server Error",
              error: { message: "Server error occurred" },
            })
        )
      );
      const user = userEvent.setup();
      await renderComponent({ environmentActions: [] });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client"));

      await waitFor(() => {
        expect(mockToastService.showError).toHaveBeenCalledWith(
          "Server error occurred",
          "Error while opening client"
        );
      });
    });

    it("does not disable the button on non-400 errors", async () => {
      mockEnvironmentService.getMXClientDetails.mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status: 500, statusText: "Error" })
        )
      );
      const user = userEvent.setup();
      await renderComponent({ environmentActions: [] });

      await user.click(getMainButton(/Open MX.3 Client/));
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Open MX.3 Client" })
        ).toBeInTheDocument();
      });
      await user.click(getMenuItemLink("Open MX.3 Client"));

      await waitFor(() => {
        expect(getMainButton(/Open MX.3 Client/)).not.toBeDisabled();
      });
    });
  });

  describe("iconOnly mode", () => {
    it("renders a labeled button when iconOnly is false", async () => {
      await renderComponent({ iconOnly: false });

      expect(
        screen.getByRole("button", { name: /Open MX.3 Client/ })
      ).toBeTruthy();
    });

    it("does not render a labeled button when iconOnly is true", async () => {
      await renderComponent({ iconOnly: true });

      expect(
        screen.queryByRole("button", { name: /Open MX.3 Client/ })
      ).toBeNull();
    });

    it("clicking the icon-only button opens the menu", async () => {
      const user = userEvent.setup();
      await renderComponent({ iconOnly: true, environmentActions: [] });

      await user.click(
        screen.getByTestId("open-client-button").querySelector("button")!
      );

      await waitFor(() => {
        expect(screen.getByText("MX.3 Client")).toBeInTheDocument();
      });
    });

    it("in icon-only mode with regular client, clicking 'MX.3 Client' triggers callCompanionUrl", async () => {
      const user = userEvent.setup();
      await renderComponent({ iconOnly: true, environmentActions: [] });

      await user.click(
        screen.getByTestId("open-client-button").querySelector("button")!
      );
      await waitFor(() => {
        expect(screen.getByText("MX.3 Client")).toBeInTheDocument();
      });
      await user.click(screen.getByText("MX.3 Client"));

      expect(mockCompanionService.callCompanionUrl).toHaveBeenCalledWith(
        expect.objectContaining({ launcher: "client" })
      );
    });

    it("in icon-only mode with WEB_CLIENT, shows 'Open Web Client' menu item and calls launchWebClient", async () => {
      const user = userEvent.setup();
      await renderComponent({
        iconOnly: true,
        environmentActions: ["WEB_CLIENT"],
        webClientUrl: "https://web.example.com",
      });

      await user.click(
        screen.getByTestId("open-client-button").querySelector("button")!
      );
      await waitFor(() => {
        expect(screen.getByText("Open Web Client")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Open Web Client"));

      expect(mockCompanionService.launchWebClient).toHaveBeenCalledWith(
        "https://web.example.com"
      );
    });

    it("in icon-only mode with SECURE_CLIENT, shows 'MX.3 Client TLS' as first menu item", async () => {
      const user = userEvent.setup();
      await renderComponent({
        iconOnly: true,
        environmentActions: ["SECURE_CLIENT"],
        secureClientArtifactUri: "https://secure.example.com",
      });

      await user.click(
        screen.getByTestId("open-client-button").querySelector("button")!
      );

      await waitFor(() => {
        expect(screen.getByText("MX.3 Client TLS")).toBeInTheDocument();
      });
    });

    it("the icon-only button is disabled when status is not READY", async () => {
      await renderComponent({
        iconOnly: true,
        status: EnvironmentStatus.PREPARING,
      });

      expect(
        screen.getByTestId("open-client-button").querySelector("button")
      ).toBeDisabled();
    });

    it("shows the client type label as tooltip in icon-only mode when no error", async () => {
      const user = userEvent.setup();
      await renderComponent({ iconOnly: true, environmentActions: [] });

      await user.hover(screen.getByRole("button", { name: "Open Client" }));

      await waitFor(() => {
        expect(screen.getByText("Open MX.3 Client")).toBeInTheDocument();
      });
    });

    it("shows error tooltip instead of label when there is an error in icon-only mode", async () => {
      const user = userEvent.setup();
      await renderComponent({
        iconOnly: true,
        environmentActions: ["WEB_CLIENT"],
        webClientUrl: undefined,
      });

      await user.hover(screen.getByRole("button", { name: "Open Client" }));

      await waitFor(() => {
        expect(
          screen.getByText("Web client is not available")
        ).toBeInTheDocument();
      });
    });
  });
});
