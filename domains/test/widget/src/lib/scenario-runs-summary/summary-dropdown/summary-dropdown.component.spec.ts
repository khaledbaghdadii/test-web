import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent } from "ng-mocks";

import { SummaryDropdownComponent } from "./summary-dropdown.component";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import type { SummaryDropdownItem } from "./summary-dropdown-item";

const MOCK_IMPORTS = [MockComponent(MxevolveIconComponent)];

const MOCK_ITEMS: SummaryDropdownItem[] = [
  { value: "Passed", label: "Passed", count: 3, active: false },
  { value: "Failed", label: "Failed", count: 1, active: false },
  { value: "Cancelled", label: "Cancelled", count: 0, active: false },
];

const REQUIRED_INPUTS = {
  count: 4,
  label: "Done",
  items: MOCK_ITEMS,
};

async function renderComponent(
  inputs: Partial<
    typeof REQUIRED_INPUTS & {
      parentActive: boolean;
      open: boolean;
      emptyMessage: string;
    }
  > = {}
) {
  return render(SummaryDropdownComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
  });
}

describe("SummaryDropdownComponent", () => {
  it("displays the count on the trigger", async () => {
    await renderComponent({ count: 7 });

    expect(screen.getByText("7")).toBeTruthy();
  });

  it("displays the label on the trigger", async () => {
    await renderComponent({ label: "Open Incidents" });

    expect(screen.getByText("Open Incidents")).toBeTruthy();
  });

  it("emits toggled when the trigger is clicked", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const emitSpy = jest.fn();
    fixture.componentInstance.toggled.subscribe(emitSpy);

    await user.click(screen.getByTestId("dropdown-trigger"));

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it("shows the dropdown panel when open", async () => {
    await renderComponent({ open: true });

    expect(screen.getByTestId("dropdown-panel")).toBeTruthy();
  });

  it("hides the dropdown panel when not open", async () => {
    await renderComponent({ open: false });

    expect(screen.queryByTestId("dropdown-panel")).toBeNull();
  });

  it("displays item labels in the dropdown panel", async () => {
    await renderComponent({ open: true });

    expect(screen.getByText("Passed")).toBeTruthy();
  });

  it("displays item counts in the dropdown panel", async () => {
    await renderComponent({ open: true });

    expect(screen.getByText("3")).toBeTruthy();
  });

  it("emits itemClicked with the item value when an item is clicked", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({ open: true });
    const emitSpy = jest.fn();
    fixture.componentInstance.itemClicked.subscribe(emitSpy);

    await user.click(screen.getByText("Passed").closest("div")!);

    expect(emitSpy).toHaveBeenCalledWith("Passed");
  });

  it("shows empty message when items list is empty", async () => {
    await renderComponent({
      open: true,
      items: [],
      emptyMessage: "No open incidents",
    });

    expect(screen.getByText("No open incidents")).toBeTruthy();
  });

  it("highlights the trigger border when parentActive", async () => {
    await renderComponent({ parentActive: true });

    const trigger = screen.getByTestId("dropdown-trigger");
    expect(trigger.classList.contains("border-blue-400")).toBe(true);
  });

  it("shows blue bold label on trigger when parentActive", async () => {
    await renderComponent({ parentActive: true });

    const label = screen.getByText("Done");
    expect(label.classList.contains("text-blue-500")).toBe(true);
  });

  it("shows bold label on trigger when parentActive", async () => {
    await renderComponent({ parentActive: true });

    const label = screen.getByText("Done");
    expect(label.classList.contains("font-bold")).toBe(true);
  });

  it("highlights active item label in dropdown", async () => {
    const itemsWithActive: SummaryDropdownItem[] = [
      { value: "Passed", label: "Passed", count: 3, active: true },
      { value: "Failed", label: "Failed", count: 1, active: false },
    ];
    await renderComponent({ open: true, items: itemsWithActive });

    const label = screen.getByText("Passed");
    expect(label.classList.contains("text-blue-500")).toBe(true);
  });

  it("does not highlight inactive item label in dropdown", async () => {
    const itemsWithActive: SummaryDropdownItem[] = [
      { value: "Passed", label: "Passed", count: 3, active: true },
      { value: "Failed", label: "Failed", count: 1, active: false },
    ];
    await renderComponent({ open: true, items: itemsWithActive });

    const label = screen.getByText("Failed");
    expect(label.classList.contains("text-blue-500")).toBe(false);
  });

  it("does not highlight trigger border when not parentActive", async () => {
    await renderComponent({ parentActive: false });

    const trigger = screen.getByTestId("dropdown-trigger");
    expect(trigger.classList.contains("border-blue-400")).toBe(false);
  });
});
