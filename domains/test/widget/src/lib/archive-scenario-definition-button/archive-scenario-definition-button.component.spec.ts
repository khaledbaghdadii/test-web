import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, Subject, throwError } from "rxjs";
import { Button } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { TooltipModule } from "primeng/tooltip";
import { MockComponent } from "ng-mocks";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ArchiveScenarioDefinitionButtonComponent } from "./archive-scenario-definition-button.component";
const MOCK_IMPORTS = [
  Button,
  ConfirmDialogModule,
  TooltipModule,
  MockComponent(MxevolveIconComponent),
];

const mockScenarioDefinitionService = {
  archiveScenarioDefinition: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const projectId = "project-123";
const scenarioDefinitionId = "scenario-def-456";
const scenarioDefinitionName = "my-scenario-definition";

const REQUIRED_INPUTS = {
  projectId: projectId,
  scenarioDefinitionId: scenarioDefinitionId,
  scenarioDefinitionName: scenarioDefinitionName,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ArchiveScenarioDefinitionButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: ScenarioDefinitionService,
        useValue: mockScenarioDefinitionService,
      },
      { provide: ConfirmationService, useValue: new ConfirmationService() },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

describe("ArchiveScenarioDefinitionButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioDefinitionService.archiveScenarioDefinition.mockReturnValue(
      of(undefined)
    );
  });

  describe("archive button", () => {
    it("renders the archive button", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Archive scenario definition" })
      ).toBeTruthy();
    });

    it("has an Archive tooltip on the button", async () => {
      await renderComponent();
      const user = userEvent.setup();

      await user.hover(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );

      await waitFor(() => {
        expect(document.querySelector(".p-tooltip-text")).toHaveTextContent(
          "Archive"
        );
      });
    });
  });

  describe("confirmation dialog", () => {
    it("opens the confirmation dialog when the button is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );

      expect(
        screen.getByText(/Are you sure you want to archive scenario definition/)
      ).toBeTruthy();
    });

    it("shows the scenario definition name in the confirmation message", async () => {
      const user = userEvent.setup();
      await renderComponent({
        scenarioDefinitionName: scenarioDefinitionName,
      });

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );

      expect(screen.getByText(scenarioDefinitionName)).toBeTruthy();
    });
  });

  describe("archiving the scenario definition", () => {
    it("shows a success toast after a successful archive", async () => {
      const user = userEvent.setup();
      await renderComponent({
        scenarioDefinitionName: scenarioDefinitionName,
      });

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Scenario definition my-scenario-definition successfully archived."
      );
    });

    it("does not archive when the user clicks Cancel", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(
        mockScenarioDefinitionService.archiveScenarioDefinition
      ).not.toHaveBeenCalled();
      expect(mockToastService.showSuccess).not.toHaveBeenCalled();
      expect(mockToastService.showError).not.toHaveBeenCalled();
    });

    it("shows an error toast when the archive fails", async () => {
      mockScenarioDefinitionService.archiveScenarioDefinition.mockReturnValue(
        throwError(() => new Error("network error"))
      );
      const user = userEvent.setup();
      await renderComponent({
        scenarioDefinitionName: scenarioDefinitionName,
      });

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "Failed to archive scenario definition my-scenario-definition."
      );
    });

    it("shows a loading state while the archive request is in progress", async () => {
      const archiveSubject = new Subject<void>();
      mockScenarioDefinitionService.archiveScenarioDefinition.mockReturnValue(
        archiveSubject
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(
        screen.getByRole("button", { name: "Archive scenario definition" })
      ).toBeDisabled();

      archiveSubject.next();
      archiveSubject.complete();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Archive scenario definition" })
        ).not.toBeDisabled()
      );
    });

    it("removes the loading state after a failed archive", async () => {
      mockScenarioDefinitionService.archiveScenarioDefinition.mockReturnValue(
        throwError(() => new Error("network error"))
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(
        screen.getByRole("button", { name: "Archive scenario definition" })
      ).not.toBeDisabled();
    });

    it("calls the archive service with the correct parameters", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(
        mockScenarioDefinitionService.archiveScenarioDefinition
      ).toHaveBeenCalledWith(projectId, scenarioDefinitionId);
    });

    it("emits archived event when the archive succeeds", async () => {
      const { fixture } = await renderComponent();
      const archivedSpy = jest.spyOn(
        fixture.componentInstance.archived,
        "emit"
      );
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: "Archive scenario definition" })
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(archivedSpy).toHaveBeenCalled();
    });
  });
});
