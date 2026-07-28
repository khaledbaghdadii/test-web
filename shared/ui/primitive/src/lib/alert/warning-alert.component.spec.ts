import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { WarningAlertComponent } from "./warning-alert.component";

async function renderComponent(
  inputs: Partial<{ message: string; closable: boolean }> = {}
) {
  return render(WarningAlertComponent, {
    inputs: { message: "Something needs your attention", ...inputs },
  });
}

describe("WarningAlertComponent", () => {
  it("shows the warning message", async () => {
    await renderComponent({ message: "No final product on this branch" });

    expect(screen.getByText("No final product on this branch")).toBeTruthy();
  });

  it("cannot be dismissed by default", async () => {
    await renderComponent();

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("can be dismissed when marked as closable", async () => {
    await renderComponent({ closable: true });

    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("notifies the parent when the user dismisses it", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({ closable: true });
    const closed = jest.fn();
    fixture.componentInstance.closed.subscribe(closed);

    await user.click(screen.getByRole("button"));

    expect(closed).toHaveBeenCalled();
  });
});
