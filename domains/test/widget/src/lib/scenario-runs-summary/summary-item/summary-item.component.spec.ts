import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { SummaryItemComponent } from "./summary-item.component";

const REQUIRED_INPUTS = {
  count: 5,
  label: "Not Started",
};

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS & { active: boolean }> = {}
) {
  return render(SummaryItemComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
  });
}

describe("SummaryItemComponent", () => {
  it("displays the count", async () => {
    await renderComponent({ count: 42 });

    expect(screen.getByText("42")).toBeTruthy();
  });

  it("displays the label", async () => {
    await renderComponent({ label: "Regressions" });

    expect(screen.getByText("Regressions")).toBeTruthy();
  });

  it("emits clicked when the item is clicked", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const emitSpy = jest.fn();
    fixture.componentInstance.clicked.subscribe(emitSpy);

    await user.click(screen.getByText("Not Started"));

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it("highlights the border blue when active", async () => {
    await renderComponent({ active: true });

    const container = screen.getByText("Not Started").closest("div")!;
    expect(container.classList.contains("border-blue-400")).toBe(true);
  });

  it("shows blue background when active", async () => {
    await renderComponent({ active: true });

    const container = screen.getByText("Not Started").closest("div")!;
    expect(container.classList.contains("bg-blue-50")).toBe(true);
  });

  it("shows blue bold text for the label when active", async () => {
    await renderComponent({ active: true });

    const label = screen.getByText("Not Started");
    expect(label.classList.contains("text-blue-500")).toBe(true);
  });

  it("shows bold text for the label when active", async () => {
    await renderComponent({ active: true });

    const label = screen.getByText("Not Started");
    expect(label.classList.contains("font-bold")).toBe(true);
  });

  it("does not highlight the border when not active", async () => {
    await renderComponent({ active: false });

    const container = screen.getByText("Not Started").closest("div")!;
    expect(container.classList.contains("border-blue-400")).toBe(false);
  });

  it("does not show blue text for the label when not active", async () => {
    await renderComponent({ active: false });

    const label = screen.getByText("Not Started");
    expect(label.classList.contains("text-blue-500")).toBe(false);
  });
});
