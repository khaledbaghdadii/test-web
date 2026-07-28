import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { FormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ShutdownPolicyService } from "@mxevolve/domains/environment/data-access";
import { EnvironmentShutdownPolicyToggleComponent } from "./shutdown-policy-toggle.component";
import { ToggleTooltipPipe } from "./toggle-tooltip.pipe";

const MOCK_IMPORTS = [FormsModule, ToggleSwitch, Tooltip, ToggleTooltipPipe];

const mockShutdownPolicyService = {
  getEnvironmentShutdownPolicyState: jest.fn(),
  includeEnvironmentInShutdownPolicy: jest.fn(),
  excludeEnvironmentFromShutdownPolicy: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  allocationId: "alloc-456",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(EnvironmentShutdownPolicyToggleComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: ShutdownPolicyService,
        useValue: mockShutdownPolicyService,
      },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

describe("EnvironmentShutdownPolicyToggleComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
      of({ isIncludedInShutdown: true, actionsAllowed: true })
    );
    mockShutdownPolicyService.includeEnvironmentInShutdownPolicy.mockReturnValue(
      of(undefined)
    );
    mockShutdownPolicyService.excludeEnvironmentFromShutdownPolicy.mockReturnValue(
      of(undefined)
    );
  });

  describe("loading the policy state", () => {
    it("loads the state with the project and allocation ids", async () => {
      await renderComponent({
        projectId: "project-123",
        allocationId: "alloc-456",
      });

      expect(
        mockShutdownPolicyService.getEnvironmentShutdownPolicyState
      ).toHaveBeenCalledWith("project-123", "alloc-456");
    });

    it("shows the Included in WRP label when the environment is included", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: true, actionsAllowed: true })
      );

      await renderComponent();

      expect(screen.getByText("Included in WRP")).toBeTruthy();
    });

    it("shows the Excluded from WRP label when the environment is excluded", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: false, actionsAllowed: true })
      );

      await renderComponent();

      expect(screen.getByText("Excluded from WRP")).toBeTruthy();
    });

    it("shows an error toast when loading the state fails", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        throwError(() => new Error("load failed"))
      );

      await renderComponent();

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "load failed",
        "Failed to check the WRP status of the environment."
      );
    });
  });

  describe("toggle visibility", () => {
    it("renders the toggle when actions are allowed", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: true, actionsAllowed: true })
      );

      await renderComponent();

      expect(screen.getByRole("switch")).toBeTruthy();
    });

    it("does not render the toggle when actions are not allowed", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: true, actionsAllowed: false })
      );

      await renderComponent();

      expect(screen.queryByRole("switch")).toBeNull();
    });
  });

  describe("changing the policy", () => {
    it("excludes the environment when toggling on from an included state", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: true, actionsAllowed: true })
      );
      const user = userEvent.setup();
      await renderComponent({
        projectId: "project-123",
        allocationId: "alloc-456",
      });

      await user.click(screen.getByRole("switch"));

      expect(
        mockShutdownPolicyService.excludeEnvironmentFromShutdownPolicy
      ).toHaveBeenCalledWith("project-123", "alloc-456");
    });

    it("shows a success toast after excluding the environment", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: true, actionsAllowed: true })
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("switch"));

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "The environment is scheduled to be excluded from the WRP. This may take a few minutes to take effect."
      );
    });

    it("includes the environment when toggling off from an excluded state", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: false, actionsAllowed: true })
      );
      const user = userEvent.setup();
      await renderComponent({
        projectId: "project-123",
        allocationId: "alloc-456",
      });

      await user.click(screen.getByRole("switch"));

      expect(
        mockShutdownPolicyService.includeEnvironmentInShutdownPolicy
      ).toHaveBeenCalledWith("project-123", "alloc-456");
    });

    it("shows a success toast after including the environment", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: false, actionsAllowed: true })
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("switch"));

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "The environment is scheduled to be included in the WRP. This may take a few minutes to take effect."
      );
    });

    it("shows an error toast when excluding the environment fails", async () => {
      mockShutdownPolicyService.getEnvironmentShutdownPolicyState.mockReturnValue(
        of({ isIncludedInShutdown: true, actionsAllowed: true })
      );
      mockShutdownPolicyService.excludeEnvironmentFromShutdownPolicy.mockReturnValue(
        throwError(() => new Error("exclude failed"))
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("switch"));

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "exclude failed",
        "Failed to schedule the environment to be excluded from the WRP."
      );
    });
  });
});
