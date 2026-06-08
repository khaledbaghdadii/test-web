import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, Subject, throwError } from "rxjs";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { ReactiveFormsModule } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import {
  ToastMessageService,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import { ExecutionAbortService } from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionStatus,
  ExecutionFamily,
} from "@mxevolve/domains/business-process/util";
import {
  DeleteDevelopmentCheckboxComponent,
  DeleteDevelopmentValue,
} from "@mxevolve/domains/business-process/widget";
import { ExecutionAbortButtonComponent } from "./execution-abort-button.component";
import {
  AnalyticsTrackerService,
  EventCategory,
  EventAction,
} from "@mxflow/core/analytics-tracker";

const MOCK_IMPORTS = [
  Button,
  Tooltip,
  ConfirmDialog,
  MxevolveIconComponent,
  MockComponent(DeleteDevelopmentCheckboxComponent),
  ReactiveFormsModule,
];

const mockAbortService = {
  abort: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const mockAnalyticsTracker = {
  trackEvent: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  processId: "process-456",
  status: ExecutionStatus.RUNNING,
  familyId: ExecutionFamily.UPGRADE_PROCESS,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ExecutionAbortButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ExecutionAbortService, useValue: mockAbortService },
      { provide: ConfirmationService, useValue: new ConfirmationService() },
      { provide: AnalyticsTrackerService, useValue: mockAnalyticsTracker },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

describe("ExecutionAbortButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAbortService.abort.mockReturnValue(of(void 0));
  });

  describe("abort button", () => {
    it("renders the abort button", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Abort business process" })
      ).toBeTruthy();
    });

    it("is disabled when the process status is PASSED", async () => {
      await renderComponent({ status: ExecutionStatus.PASSED });

      expect(
        screen.getByRole("button", { name: "Abort business process" })
      ).toBeDisabled();
    });

    it("is disabled when the process status is FAILED", async () => {
      await renderComponent({ status: ExecutionStatus.FAILED });

      expect(
        screen.getByRole("button", { name: "Abort business process" })
      ).toBeDisabled();
    });

    it("is disabled when the process status is NOT_STARTED", async () => {
      await renderComponent({ status: ExecutionStatus.NOT_STARTED });

      expect(
        screen.getByRole("button", { name: "Abort business process" })
      ).toBeDisabled();
    });

    it("is disabled when the process status is ABORTED", async () => {
      await renderComponent({ status: ExecutionStatus.ABORTED });

      expect(
        screen.getByRole("button", { name: "Abort business process" })
      ).toBeDisabled();
    });

    it("is enabled when the process status is RUNNING", async () => {
      await renderComponent({ status: ExecutionStatus.RUNNING });

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Abort business process" })
        ).not.toBeDisabled()
      );
    });

    it("is enabled when the process status is PENDING_INPUT", async () => {
      await renderComponent({ status: ExecutionStatus.PENDING_INPUT });

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Abort business process" })
        ).not.toBeDisabled()
      );
    });
  });

  describe("abort confirmation dialog", () => {
    it("opens the confirmation dialog when the button is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );

      expect(
        screen.getByText(/Are you sure you want to abort the process\?/)
      ).toBeTruthy();
    });

    it("renders delete development checkbox when the dialog is opened", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-delete-development-checkbox")
        ).toBeTruthy()
      );

      const checkbox = ngMocks.find(
        fixture,
        DeleteDevelopmentCheckboxComponent
      ).componentInstance;
      expect(checkbox.projectId).toBe("project-123");
      expect(checkbox.processId).toBe("process-456");
      expect(checkbox.actionLabel).toBe("when process is aborted");
      expect(checkbox.familyId).toBe(ExecutionFamily.UPGRADE_PROCESS);
    });

    it("passes USER_STORY_BUILD_AND_TEST family id to the delete development checkbox", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
      });

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-delete-development-checkbox")
        ).toBeTruthy()
      );

      const checkbox = ngMocks.find(
        fixture,
        DeleteDevelopmentCheckboxComponent
      ).componentInstance;
      expect(checkbox.familyId).toBe(ExecutionFamily.USER_STORY_BUILD_AND_TEST);
    });
  });

  describe("aborting the process", () => {
    it("aborts with shouldCleanDevelopment and developmentId from the checkbox value", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      fixture.componentInstance.deleteDevelopmentControl.setValue({
        shouldDelete: true,
        developmentId: "dev-1",
      } as DeleteDevelopmentValue);
      await user.click(screen.getByRole("button", { name: "Abort" }));

      expect(mockAbortService.abort).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldCleanDevelopment: true,
          developmentId: "dev-1",
        })
      );
    });

    it("shows a success toast after a successful abort", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      await user.click(screen.getByRole("button", { name: "Abort" }));

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        "Business process execution successfully aborted"
      );
    });

    it("emits the aborted event after a successful abort", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const abortedSpy = jest.fn();
      fixture.componentInstance.aborted.subscribe(abortedSpy);

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      await user.click(screen.getByRole("button", { name: "Abort" }));

      expect(abortedSpy).toHaveBeenCalled();
    });

    it("shows an error toast when the abort fails", async () => {
      mockAbortService.abort.mockReturnValue(
        throwError(() => new Error("abort service error"))
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      await user.click(screen.getByRole("button", { name: "Abort" }));

      expect(mockToastService.showError).toHaveBeenCalledWith(
        "abort service error"
      );
    });

    it("does not abort the process when the user cancels the dialog", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(mockAbortService.abort).not.toHaveBeenCalled();
    });

    it("shows a loading state while the abort request is being processed", async () => {
      const abortSubject = new Subject<void>();
      mockAbortService.abort.mockReturnValue(abortSubject);
      const user = userEvent.setup();

      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      await user.click(screen.getByRole("button", { name: "Abort" }));

      expect(
        screen.getByRole("button", { name: "Abort business process" })
      ).toBeDisabled();

      abortSubject.next();
      abortSubject.complete();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Abort business process" })
        ).not.toBeDisabled()
      );
    });

    it("removes the loading state if the abort request fails", async () => {
      mockAbortService.abort.mockReturnValue(
        throwError(() => new Error("abort service error"))
      );
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      await user.click(screen.getByRole("button", { name: "Abort" }));

      expect(
        screen.getByRole("button", { name: "Abort business process" })
      ).not.toBeDisabled();
    });

    it("should track analytics event on successful abort", async () => {
      const user = userEvent.setup();
      await renderComponent({ familyId: ExecutionFamily.UPGRADE_PROCESS });

      await user.click(
        screen.getByRole("button", { name: "Abort business process" })
      );
      await user.click(screen.getByRole("button", { name: "Abort" }));

      expect(mockAnalyticsTracker.trackEvent).toHaveBeenCalledWith(
        EventCategory.BUTTON,
        EventAction.CLICK_BUTTON,
        `Abort Business Process - ${ExecutionFamily.UPGRADE_PROCESS}`
      );
    });
  });
});
