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
import { EnvironmentCleanService } from "@mxevolve/domains/environment/data-access";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { EnvironmentCleanButtonComponent } from "./clean-button.component";

const MOCK_IMPORTS = [
  ButtonModule,
  ConfirmDialog,
  Tooltip,
  MockComponent(MxevolveIconComponent),
  MockDirective(ShowElementIfAuthorizedDirective),
];

const mockEnvironmentCleanService = {
  cleanEnvironment: jest.fn(),
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
  const result = await render(EnvironmentCleanButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: EnvironmentCleanService,
        useValue: mockEnvironmentCleanService,
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

async function clickCleanButton() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Clean environment" }));
}

async function confirmClean() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("EnvironmentCleanButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvironmentCleanService.cleanEnvironment.mockReturnValue(of(undefined));
  });

  describe("clean button", () => {
    it("renders the clean button", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Clean environment" })
      ).toBeTruthy();
    });

    it("renders the cleaning_services icon", async () => {
      await renderComponent();

      expect(ngMocks.input(ngMocks.find(MxevolveIconComponent), "name")).toBe(
        "cleaning_services"
      );
    });
  });

  describe("confirmation dialog", () => {
    it("opens the confirmation dialog when the button is clicked", async () => {
      await renderComponent();

      await clickCleanButton();

      expect(
        screen.getByText(/Are you sure you want to clean environment/)
      ).toBeTruthy();
    });

    it("shows the environment id in the confirmation message", async () => {
      await renderComponent({ environmentId: "env-456" });

      await clickCleanButton();

      expect(screen.getByText("env-456")).toBeTruthy();
    });
  });

  describe("cleaning the environment", () => {
    it("calls the clean service with the project and environment ids on confirm", async () => {
      await renderComponent({
        projectId: "project-123",
        environmentId: "env-456",
      });

      await clickCleanButton();
      await confirmClean();

      expect(mockEnvironmentCleanService.cleanEnvironment).toHaveBeenCalledWith(
        "project-123",
        "env-456"
      );
    });

    it("shows a success toast after a successful clean", async () => {
      await renderComponent({ environmentId: "env-456" });

      await clickCleanButton();
      await confirmClean();

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Environment env-456 clean requested successfully."
      );
    });

    it("emits the cleaned output after a successful clean", async () => {
      const cleaned = jest.fn();
      const { fixture } = await renderComponent();
      fixture.componentInstance.cleaned.subscribe(cleaned);

      await clickCleanButton();
      await confirmClean();

      expect(cleaned).toHaveBeenCalled();
    });

    it("shows an error toast when the clean fails", async () => {
      mockEnvironmentCleanService.cleanEnvironment.mockReturnValue(
        throwError(() => new Error("clean failed"))
      );
      await renderComponent();

      await clickCleanButton();
      await confirmClean();

      expect(mockToastService.showError).toHaveBeenCalledWith("clean failed");
    });

    it("does not clean when the user clicks Cancel", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await clickCleanButton();
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(
        mockEnvironmentCleanService.cleanEnvironment
      ).not.toHaveBeenCalled();
    });
  });

  describe("authorization", () => {
    it("guards the clean button with the clean action scoped to the project", async () => {
      await renderComponent({ projectId: "project-123" });

      const directive = ngMocks.findInstances(
        ShowElementIfAuthorizedDirective
      )[0];
      expect(directive.showElementIfAuthorized).toEqual({
        action: "clean",
        resource: "environment",
        package: "environment",
        attributes: {},
        projectId: "project-123",
      });
    });
  });
});
