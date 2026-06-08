import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { AuthorizationService } from "@mxflow/core/auth";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { ClipboardService } from "./clipboard.service";
import { ConfigureMxTestButtonComponent } from "./configure-mxtest-button.component";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [Button, Tooltip];

const mockClipboardService = {
  copyToClipboard: jest.fn(),
};

const mockAuthorizationService = {
  isAuthorized: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

async function renderComponent(
  overrides: {
    projectId?: string;
    status?: EnvironmentStatus;
    outputsDirectoryUri?: string;
    bundles?: Array<{
      id: string;
      branch: string;
      version: string;
      type?: string;
    }>;
    isTools?: Array<{ name: string }>;
    iconOnly?: boolean;
    menuItem?: boolean;
  } = {}
) {
  return render(ConfigureMxTestButtonComponent, {
    inputs: {
      projectId: "proj-001",
      status: EnvironmentStatus.READY,
      outputsDirectoryUri: "https://storage/outputs",
      bundles: [],
      isTools: [],
      ...overrides,
    },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ClipboardService, useValue: mockClipboardService },
      { provide: AuthorizationService, useValue: mockAuthorizationService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("ConfigureMxTestButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboardService.copyToClipboard.mockResolvedValue(undefined);
    mockAuthorizationService.isAuthorized.mockReturnValue(of(true));
  });

  it("renders the 'Copy' button", async () => {
    await renderComponent();

    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("is enabled when status is READY and outputsDirectoryUri is provided", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );
  });

  it("is disabled when the user is not authorized to copy details", async () => {
    mockAuthorizationService.isAuthorized.mockReturnValue(of(false));

    await renderComponent();

    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });

  it("is disabled when the authorization lookup fails", async () => {
    mockAuthorizationService.isAuthorized.mockReturnValue(
      throwError(() => new Error("Authorization failed"))
    );

    await renderComponent();

    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });

  it("is disabled when the environment status is not READY", async () => {
    await renderComponent({ status: EnvironmentStatus.BROKEN });

    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });

  it("is disabled when outputsDirectoryUri is not provided", async () => {
    await renderComponent({ outputsDirectoryUri: undefined });

    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });

  it("shows a tooltip on hover", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.hover(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByText("Copy Details for MXtest")).toBeTruthy();
  });

  it("shows a copied tooltip after a successful copy", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() =>
      expect(fixture.componentInstance.tooltip()).toBe("Copied!")
    );
  });

  it("copies the mxtest path to the clipboard when clicked", async () => {
    const user = userEvent.setup();
    await renderComponent({ outputsDirectoryUri: "https://storage/outputs" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith(
      "https://storage/outputs/mxtest"
    );
  });

  it("copies the mxtest_web path when an mxtestweb bundle is present", async () => {
    const user = userEvent.setup();
    await renderComponent({
      outputsDirectoryUri: "https://storage/outputs",
      bundles: [{ id: "mxtestweb", branch: "main", version: "1.0.0" }],
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith(
      "https://storage/outputs/mxtest_web"
    );
  });

  it("copies the mxtest_web path when the bundle type is mxtestweb", async () => {
    const user = userEvent.setup();
    await renderComponent({
      outputsDirectoryUri: "https://storage/outputs",
      bundles: [
        {
          id: "bundle-001",
          branch: "main",
          version: "1.0.0",
          type: "MXTESTWEB",
        },
      ],
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith(
      "https://storage/outputs/mxtest_web"
    );
  });

  it("copies the mxtest_web path when an mxtestweb isTool is present", async () => {
    const user = userEvent.setup();
    await renderComponent({
      outputsDirectoryUri: "https://storage/outputs",
      bundles: [],
      isTools: [{ name: "mxtestweb" }],
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith(
      "https://storage/outputs/mxtest_web"
    );
  });

  it("requests authorization with the projectId input", async () => {
    await renderComponent({ projectId: "proj-001" });

    expect(mockAuthorizationService.isAuthorized).toHaveBeenCalledWith(
      {
        action: "copy_mxtest_details",
        attributes: {},
        package: "web",
        resource: "environment_page",
      },
      "proj-001"
    );
  });

  it("does nothing when copy is triggered without an outputs directory", async () => {
    const { fixture } = await renderComponent({
      outputsDirectoryUri: undefined,
    });

    await fixture.componentInstance.onCopy();

    expect(mockClipboardService.copyToClipboard).not.toHaveBeenCalled();
  });

  it("shows an error toast when copying fails", async () => {
    const user = userEvent.setup();
    mockClipboardService.copyToClipboard.mockRejectedValue(
      new Error("Copy failed")
    );

    await renderComponent();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      "Copy failed",
      "Failed to copy MxTest Package Details"
    );
  });

  it("shows a stringified error toast when copying fails with a non-error", async () => {
    const user = userEvent.setup();
    mockClipboardService.copyToClipboard.mockRejectedValue("Copy failed");

    await renderComponent();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toBeDisabled()
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      "Copy failed",
      "Failed to copy MxTest Package Details"
    );
  });

  describe("iconOnly mode", () => {
    it("renders a labeled button when iconOnly is false", async () => {
      await renderComponent({ iconOnly: false });

      expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    });

    it("does not render a labeled button when iconOnly is true", async () => {
      await renderComponent({ iconOnly: true });

      expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
    });
  });
});
