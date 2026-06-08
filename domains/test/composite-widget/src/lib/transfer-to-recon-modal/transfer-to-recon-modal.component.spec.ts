import { fireEvent, render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { TransferToReconModalComponent } from "./transfer-to-recon-modal.component";
import { MockComponent, ngMocks } from "ng-mocks";
import { Dialog } from "primeng/dialog";
import { Button } from "primeng/button";
import { Chip } from "primeng/chip";
import {
  Step,
  StepList,
  StepPanel,
  StepPanels,
  Stepper,
} from "primeng/stepper";
import { PrimeTemplate } from "primeng/api";
import { ComponentFixture } from "@angular/core/testing";
import {
  Binding,
  inputBinding,
  outputBinding,
  signal,
  twoWayBinding,
} from "@angular/core";
import { Cycle, CycleSelectorComponent } from "@mxflow/features/reconciliation";

async function renderComponent(bindings: Binding[] = []) {
  return render(TransferToReconModalComponent, {
    bindings: [inputBinding("projectId", () => "project-1"), ...bindings],
    imports: [
      Dialog,
      Button,
      Stepper,
      StepList,
      Step,
      StepPanels,
      StepPanel,
      Chip,
      MockComponent(CycleSelectorComponent),
      PrimeTemplate,
    ],
  });
}

function isActiveStep(step: string) {
  return screen.getByText(step).closest("[aria-current='step']");
}

function getDialogContent() {
  return screen.queryByText("Reports To Be Transferred");
}

async function navigateToSelectCycleStep() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Next/i }));

  await waitFor(() => {
    expect(isActiveStep("Select Cycle")).not.toBeNull();
  });
}

function selectCycle(fixture: ComponentFixture<TransferToReconModalComponent>) {
  ngMocks
    .find(fixture, CycleSelectorComponent)
    .componentInstance.selectionChange.emit([
      { id: "cycle-42" } as unknown as Cycle,
    ]);
}

async function selectCycleAndSubmit(
  fixture: ComponentFixture<TransferToReconModalComponent>
) {
  selectCycle(fixture);

  await waitFor(() => {
    const submitButton = screen.getByRole("button", { name: /Submit/i });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);
  });
}

describe("TransferToReconModalComponent", () => {
  it("should show the dialog if component is visible", async () => {
    await renderComponent([inputBinding("isVisible", () => true)]);

    await waitFor(() => {
      expect(getDialogContent()).toBeTruthy();
    });
  });

  it("should hide the dialog if component is no longer visible", async () => {
    const isVisible = signal(true);
    await renderComponent([twoWayBinding("isVisible", isVisible)]);

    await waitFor(() => {
      expect(getDialogContent()).toBeTruthy();
    });

    isVisible.set(false);

    await waitFor(() => {
      expect(getDialogContent()).toBeNull();
    });
  });

  describe("Reports To Be Transferred Step", () => {
    it("renders a chip for each path to be transferred", async () => {
      const paths = ["/report/path1.xml", "/report/path2.xml"];
      await renderComponent([
        inputBinding("pathsToTransfer", () => paths),
        inputBinding("isVisible", () => true),
      ]);
      await waitFor(() => {
        for (const path of paths) {
          expect(screen.getByText(path)).toBeTruthy();
        }
      });
    });

    it("advances to cycle selection step when Next is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent([inputBinding("isVisible", () => true)]);

      await user.click(screen.getByRole("button", { name: /Next/i }));

      await waitFor(() => {
        expect(isActiveStep("Select Cycle")).not.toBeNull();
      });
    });
  });

  describe("Select Cycle step", () => {
    it("goes back to previous step when Back is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent([inputBinding("isVisible", () => true)]);
      await navigateToSelectCycleStep();

      await user.click(screen.getByRole("button", { name: /Back/i }));

      await waitFor(() => {
        expect(isActiveStep("Reports To Be Transferred")).not.toBeNull();
      });
    });

    it("passes the correct inputs to cycle selector", async () => {
      const { fixture } = await renderComponent([
        inputBinding("isVisible", () => true),
      ]);
      await navigateToSelectCycleStep();

      const cycleSelector = ngMocks.find(
        fixture,
        CycleSelectorComponent
      ).componentInstance;
      expect(cycleSelector.projectId).toBe("project-1");
      expect(cycleSelector.multiSelect).toBe(false);
      expect(cycleSelector.pageOnlySelect).toBe(true);
    });

    it("shows Submit button as disabled when no cycle is selected", async () => {
      await renderComponent([inputBinding("isVisible", () => true)]);
      await navigateToSelectCycleStep();

      const submitButton = screen.getByRole("button", { name: /Submit/i });
      expect(submitButton).toBeDisabled();
    });

    it("emits cycle id when Submit is clicked after a cycle is selected", async () => {
      const transferSpy = jest.fn();
      const { fixture } = await renderComponent([
        inputBinding("isVisible", () => true),
        outputBinding("transfer", transferSpy),
      ]);
      await navigateToSelectCycleStep();

      await selectCycleAndSubmit(fixture);

      await waitFor(() => {
        expect(transferSpy).toHaveBeenCalledWith("cycle-42");
      });
    });

    it("closes the dialog after a successful submit", async () => {
      const { fixture } = await renderComponent([
        inputBinding("isVisible", () => true),
      ]);
      await navigateToSelectCycleStep();

      await selectCycleAndSubmit(fixture);

      await waitFor(() => {
        expect(getDialogContent()).toBeNull();
      });
    });
  });

  it("resets to first step and clears cycle picker when dialog is closed and then opened again", async () => {
    const user = userEvent.setup();
    const isVisible = signal(true);
    const { fixture } = await renderComponent([
      twoWayBinding("isVisible", isVisible),
    ]);
    await navigateToSelectCycleStep();

    selectCycle(fixture);

    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);

    await waitFor(() => {
      expect(getDialogContent()).toBeNull();
    });

    isVisible.set(true);

    await waitFor(() => {
      expect(fixture.componentInstance.isVisible()).toBeTruthy();
      expect(getDialogContent()).not.toBeNull();
    });

    expect(isActiveStep("Reports To Be Transferred")).not.toBeNull();

    await navigateToSelectCycleStep();

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    expect(submitButton).toBeDisabled();
  });
});
