import { ReactiveFormsModule } from "@angular/forms";
import { render, screen, waitFor, within } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { BuildAndTestUserInputService } from "@mxevolve/domains/business-process/data-access";
import { ReviewersAutoCompleteComponent } from "@mxevolve/domains/scm/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { BuildAndTestMergeRequestReopenComponent } from "./build-and-test-merge-request-reopen.component";

describe("BuildAndTestMergeRequestReopenComponent", () => {
  const userInputService = {
    reopenMergeRequest: jest.fn(),
  };
  const toastMessageService = {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    userInputService.reopenMergeRequest.mockReturnValue(of(undefined));
  });

  it("renders the reopen merge request button", async () => {
    await renderComponent();

    expect(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    ).toBeTruthy();
  });

  it("disables the reopen button while actions are disabled", async () => {
    await renderComponent({ actionsDisabled: true });

    expect(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    ).toBeDisabled();
  });

  it("reopens the merge request without a dialog when details are not editable", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({
      areMergeRequestDetailsEditable: false,
    });
    const reopened = jest.fn();
    fixture.componentInstance.reopened.subscribe(reopened);

    await user.click(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(userInputService.reopenMergeRequest).toHaveBeenCalledWith({
      projectId: "project-1",
      processId: "process-1",
      title: undefined,
      reviewers: undefined,
    });
    expect(reopened).toHaveBeenCalledTimes(1);
  });

  it("opens the reopen dialog when details are editable", async () => {
    const user = userEvent.setup();
    await renderComponent({ areMergeRequestDetailsEditable: true });

    await user.click(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    expect(screen.getByLabelText(/Merge Request Name/i)).toBeTruthy();
  });

  it("does not reopen the merge request just by opening the dialog", async () => {
    const user = userEvent.setup();
    await renderComponent({ areMergeRequestDetailsEditable: true });

    await user.click(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    expect(userInputService.reopenMergeRequest).not.toHaveBeenCalled();
  });

  it("keeps the dialog submit disabled until a title is entered", async () => {
    const user = userEvent.setup();
    await renderComponent({ areMergeRequestDetailsEditable: true });

    await user.click(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("reopens with the entered title and selected reviewer names", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({
      areMergeRequestDetailsEditable: true,
    });
    const reopened = jest.fn();
    fixture.componentInstance.reopened.subscribe(reopened);

    await user.click(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    );

    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/Merge Request Name/i),
      "VAL-1 Reopen"
    );

    ngMocks
      .find(fixture, ReviewersAutoCompleteComponent)
      .componentInstance.reviewersFormControl.setValue([
        { name: "reviewer-1", displayName: "Reviewer One" },
        { name: "reviewer-2", displayName: "Reviewer Two" },
      ]);

    await user.click(within(dialog).getByRole("button", { name: "Send" }));

    expect(userInputService.reopenMergeRequest).toHaveBeenCalledWith({
      projectId: "project-1",
      processId: "process-1",
      title: "VAL-1 Reopen",
      reviewers: ["reviewer-1", "reviewer-2"],
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(reopened).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when the reopen request fails", async () => {
    const user = userEvent.setup();
    userInputService.reopenMergeRequest.mockReturnValue(
      throwError(() => new Error("Merge request cannot be reopened"))
    );
    await renderComponent({ areMergeRequestDetailsEditable: false });

    await user.click(
      screen.getByRole("button", { name: "Reopen Merge Request" })
    );

    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "Merge request cannot be reopened"
    );
  });

  function renderComponent(
    overrides: Partial<{
      areMergeRequestDetailsEditable: boolean;
      actionsDisabled: boolean;
    }> = {}
  ) {
    return render(BuildAndTestMergeRequestReopenComponent, {
      inputs: {
        areMergeRequestDetailsEditable:
          overrides.areMergeRequestDetailsEditable ?? false,
        actionsDisabled: overrides.actionsDisabled ?? false,
        projectId: "project-1",
        processId: "process-1",
        repositoryId: "repository-1",
        developmentId: "development-1",
        destinationBranch: "master",
      },
      componentImports: [
        Button,
        Dialog,
        InputText,
        ReactiveFormsModule,
        MockComponent(ReviewersAutoCompleteComponent),
      ],
      componentProviders: [
        { provide: BuildAndTestUserInputService, useValue: userInputService },
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    });
  }
});
