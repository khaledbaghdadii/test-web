import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, Subject, throwError } from "rxjs";
import { MergeRequestPrioritySelectorComponent } from "./merge-request-priority-selector.component";
import {
  MergeRequestPriority,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { RadioButtonModule } from "primeng/radiobutton";
import { Button } from "primeng/button";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

const MOCK_IMPORTS = [
  RadioButtonModule,
  Button,
  ReactiveFormsModule,
  FormsModule,
];

const mockMergeRequestService = {
  updateMergeRequestPriority: jest.fn(),
};

const mockToastMessageService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const DEFAULT_MERGE_REQUEST = {
  id: "mr-1",
  projectId: "project-1",
  mergeRequestPriority: MergeRequestPriority.MEDIUM,
};

async function renderComponent(mergeRequest = DEFAULT_MERGE_REQUEST) {
  return render(MergeRequestPrioritySelectorComponent, {
    imports: MOCK_IMPORTS,
    inputs: { mergeRequest },
    componentProviders: [
      {
        provide: MergeRequestService,
        useValue: mockMergeRequestService,
      },
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("MergeRequestPrioritySelectorComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMergeRequestService.updateMergeRequestPriority.mockReturnValue(of({}));
  });

  describe("rendering", () => {
    it("renders all priority radio buttons", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText("Low")).toBeTruthy();
        expect(screen.getByLabelText("Medium")).toBeTruthy();
        expect(screen.getByLabelText("High")).toBeTruthy();
        expect(screen.getByLabelText("Critical")).toBeTruthy();
      });
    });

    it("renders the Save button", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
      });
    });
  });

  describe("save button state", () => {
    it("save button is disabled when no priority change has been made", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      });
    });

    it("save button is enabled after selecting a different priority", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await waitFor(() => expect(screen.getByLabelText("High")).toBeTruthy());

      await user.click(screen.getByLabelText("High"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
      });
    });
  });

  describe("saving priority", () => {
    it("shows success toast when priority is updated successfully", async () => {
      const user = userEvent.setup();
      mockMergeRequestService.updateMergeRequestPriority.mockReturnValue(
        of({})
      );

      await renderComponent();

      await waitFor(() => expect(screen.getByLabelText("High")).toBeTruthy());

      await user.click(screen.getByLabelText("High"));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(
          mockMergeRequestService.updateMergeRequestPriority
        ).toHaveBeenCalledWith("project-1", "mr-1", MergeRequestPriority.HIGH);
        expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
          "Priority updated successfully"
        );
      });
    });

    it("shows error toast when priority update fails", async () => {
      const user = userEvent.setup();
      mockMergeRequestService.updateMergeRequestPriority.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByLabelText("Critical")).toBeTruthy()
      );

      await user.click(screen.getByLabelText("Critical"));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Network error"
        );
      });
    });

    it("shows loading state on save button while request is in progress", async () => {
      const user = userEvent.setup();
      const subject = new Subject<unknown>();
      mockMergeRequestService.updateMergeRequestPriority.mockReturnValue(
        subject.asObservable()
      );

      await renderComponent();

      await waitFor(() => expect(screen.getByLabelText("High")).toBeTruthy());

      await user.click(screen.getByLabelText("High"));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /Save/i });
        expect(button.querySelector(".p-button-loading-icon")).toBeTruthy();
      });

      subject.next({});
      subject.complete();

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /Save/i });
        expect(button.querySelector(".p-button-loading-icon")).toBeFalsy();
      });
    });
  });

  describe("initialization", () => {
    it("initializes form with the provided merge request priority", async () => {
      await renderComponent({
        id: "mr-2",
        projectId: "project-2",
        mergeRequestPriority: MergeRequestPriority.CRITICAL,
      });

      await waitFor(() => {
        const criticalRadio = screen.getByLabelText("Critical");
        expect(criticalRadio).toBeChecked();
      });
    });
  });
});
