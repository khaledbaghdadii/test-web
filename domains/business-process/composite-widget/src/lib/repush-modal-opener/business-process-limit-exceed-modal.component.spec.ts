import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { Button } from "primeng/button";
import { IneligibilityResult } from "@mxevolve/domains/business-process/data-access";
import { BusinessProcessLimitExceedModalComponent } from "./business-process-limit-exceed-modal.component";

async function renderComponent(ineligibilityResult?: IneligibilityResult) {
  return render(BusinessProcessLimitExceedModalComponent, {
    inputs: { ineligibilityResult, visible: true },
    componentImports: [Dialog, PrimeTemplate, Button],
  });
}

describe("BusinessProcessLimitExceedModalComponent", () => {
  it("shows the friendly type name for a known limit-group type id", async () => {
    await renderComponent({
      reason: "LOAD_LIMIT_EXCEEDED",
      ineligibilityData: {
        type: "default-binary-upgrade-limit-group",
        currentRunning: 3,
        maximumSupported: 3,
      },
    });

    expect(
      screen.getByText(/Business Process of type Binary Upgrade\./)
    ).toBeTruthy();
  });

  it("shows the raw type id when it is unknown", async () => {
    await renderComponent({
      reason: "LOAD_LIMIT_EXCEEDED",
      ineligibilityData: { type: "some-unknown-group" },
    });

    expect(
      screen.getByText(/Business Process of type some-unknown-group\./)
    ).toBeTruthy();
  });

  it("shows no type name when no ineligibility result is provided", async () => {
    await renderComponent();

    expect(screen.getByText(/Business Process of type \./)).toBeTruthy();
  });

  it("shows the running and maximum counts", async () => {
    await renderComponent({
      reason: "LOAD_LIMIT_EXCEEDED",
      ineligibilityData: {
        type: "default-master-validation-limit-group",
        currentRunning: 7,
        maximumSupported: 5,
      },
    });

    expect(
      screen.getByText(
        /You currently have 7 running where the maximum allowed is 5\./
      )
    ).toBeTruthy();
  });

  it("hides the dialog content when the Ok button is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent({
      reason: "LOAD_LIMIT_EXCEEDED",
      ineligibilityData: { type: "infinite-limit-group" },
    });

    expect(
      screen.getByText(/Please close previous unused executions/)
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Ok" }));

    await waitFor(() =>
      expect(
        screen.queryByText(/Please close previous unused executions/)
      ).toBeNull()
    );
  });
});
