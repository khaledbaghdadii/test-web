import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { ButtonModule } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { Tooltip } from "primeng/tooltip";
import { MockComponent, MockDirective, ngMocks } from "ng-mocks";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { EnvironmentAbortService } from "@mxevolve/domains/environment/data-access";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { EnvironmentAbortButtonComponent } from "./abort-button.component";

const MOCK_IMPORTS = [
  ButtonModule,
  ConfirmDialog,
  Tooltip,
  MockComponent(MxevolveIconComponent),
  MockDirective(ShowElementIfAuthorizedDirective),
];

const mockEnvironmentAbortService = {
  abortProjectEnvironments: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  environmentId: "env-456",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  const result = await render(EnvironmentAbortButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: EnvironmentAbortService,
        useValue: mockEnvironmentAbortService,
      },
      { provide: ConfirmationService, useValue: new ConfirmationService() },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
  ngMocks
    .findInstances(ShowElementIfAuthorizedDirective)
    .forEach((d) => ngMocks.render(d, d));
  result.fixture.detectChanges();
  return result;
}

async function clickAbortButton() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Abort environment" }));
}

async function confirmAbort() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("EnvironmentAbortButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvironmentAbortService.abortProjectEnvironments.mockReturnValue(
      of(undefined)
    );
  });

  describe("abort button", () => {
    it("renders the abort button", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Abort environment" })
      ).toBeTruthy();
    });

    it("renders the power_settings_new icon", async () => {
      await renderComponent();

      expect(ngMocks.input(ngMocks.find(MxevolveIconComponent), "name")).toBe(
        "power_settings_new"
      );
    });
  });

  describe("confirmation dialog", () => {
    it("opens the confirmation dialog when the button is clicked", async () => {
      await renderComponent();

      await clickAbortButton();

      expect(
        screen.getByText(/Are you sure you want to abort environment/)
      ).toBeTruthy();
    });

    it("shows the environment id in the confirmation message", async () => {
      await renderComponent({ environmentId: "env-456" });

      await clickAbortButton();

      expect(screen.getByText("env-456")).toBeTruthy();
    });
  });

  describe("aborting the environment", () => {
    it("calls the abort service with the project id and a single environment id on confirm", async () => {
      await renderComponent({
        projectId: "project-123",
        environmentId: "env-456",
      });

      await clickAbortButton();
      await confirmAbort();

      expect(
        mockEnvironmentAbortService.abortProjectEnvironments
      ).toHaveBeenCalledWith("project-123", {
        environmentIds: ["env-456"],
      });
    });

    it("shows a success toast after a successful abort", async () => {
      await renderComponent({ environmentId: "env-456" });

      await clickAbortButton();
      await confirmAbort();

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Environment env-456 abort requested successfully."
      );
    });

    it("emits the aborted output after a successful abort", async () => {
      const aborted = jest.fn();
      const { fixture } = await renderComponent();
      fixture.componentInstance.aborted.subscribe(aborted);

      await clickAbortButton();
      await confirmAbort();

      expect(aborted).toHaveBeenCalled();
    });

    it("shows an error toast when the abort fails", async () => {
      mockEnvironmentAbortService.abortProjectEnvironments.mockReturnValue(
        throwError(() => new Error("abort failed"))
      );
      await renderComponent();

      await clickAbortButton();
      await confirmAbort();

      expect(mockToastService.showError).toHaveBeenCalledWith("abort failed");
    });

    it("does not abort when the user clicks Cancel", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await clickAbortButton();
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(
        mockEnvironmentAbortService.abortProjectEnvironments
      ).not.toHaveBeenCalled();
    });
  });

  describe("authorization", () => {
    it("guards the abort button with the project_bulk_abort action scoped to the project", async () => {
      await renderComponent({ projectId: "project-123" });

      const directive = ngMocks.findInstances(
        ShowElementIfAuthorizedDirective
      )[0];
      expect(directive.showElementIfAuthorized).toEqual({
        action: "project_bulk_abort",
        resource: "environment",
        package: "environment",
        attributes: {},
        projectId: "project-123",
      });
    });
  });
});
