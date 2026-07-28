import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { OverrideBinaryImpactDescriptionComponent } from "./override-binary-impact-description.component";

async function renderComponent(inputs: { required?: boolean } = {}) {
  return render(OverrideBinaryImpactDescriptionComponent, { inputs });
}

describe("OverrideBinaryImpactDescriptionComponent", () => {
  it("renders the option to use the upgrade impact description", async () => {
    await renderComponent();

    expect(
      screen.getByRole("radio", { name: "Upgrade Impact Description" })
    ).toBeTruthy();
  });

  it("renders the option to keep the existing description", async () => {
    await renderComponent();

    expect(
      screen.getByRole("radio", { name: "Keep Existing Description" })
    ).toBeTruthy();
  });

  it("selects the option to keep the existing description when the user clicks it", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("radio", { name: "Keep Existing Description" })
    );

    await waitFor(() =>
      expect(
        screen.getByRole<HTMLInputElement>("radio", {
          name: "Keep Existing Description",
        }).checked
      ).toBeTruthy()
    );
  });

  it("selects the option to use the upgrade impact description when the user clicks it", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("radio", { name: "Upgrade Impact Description" })
    );

    await waitFor(() =>
      expect(
        screen.getByRole<HTMLInputElement>("radio", {
          name: "Upgrade Impact Description",
        }).checked
      ).toBeTruthy()
    );
  });

  it("deselects the option to use the upgrade impact description when the keep existing description option is selected", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(
      screen.getByRole("radio", { name: "Upgrade Impact Description" })
    );
    await user.click(
      screen.getByRole("radio", { name: "Keep Existing Description" })
    );

    await waitFor(() =>
      expect(
        screen.getByRole<HTMLInputElement>("radio", {
          name: "Upgrade Impact Description",
        }).checked
      ).toBeFalsy()
    );
  });

  it("sets the flag to override binary impact description to false when the user selects keep existing description option", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(
      screen.getByRole("radio", { name: "Keep Existing Description" })
    );

    await waitFor(() =>
      expect(
        fixture.componentInstance.overrideBinaryImpactDescription()
      ).toBeFalsy()
    );
  });

  it("sets the flag to override binary impact description to true when the user selects upgrade impact description option", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(
      screen.getByRole("radio", { name: "Upgrade Impact Description" })
    );

    await waitFor(() =>
      expect(
        fixture.componentInstance.overrideBinaryImpactDescription()
      ).toBeTruthy()
    );
  });

  it("marks the title as required when the required input is true", async () => {
    await renderComponent({ required: true });

    expect(screen.getByText("*")).toBeTruthy();
  });

  it("does not mark the title as required when the required input is false", async () => {
    await renderComponent({ required: false });

    expect(screen.queryByText("*")).toBeNull();
  });

  it("does not mark the title as required by default", async () => {
    await renderComponent();

    expect(screen.queryByText("*")).toBeNull();
  });
});
