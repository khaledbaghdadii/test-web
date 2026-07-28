import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { Button } from "primeng/button";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { SubFamilyOption } from "../derive-sub-families";
import { TemplatesSubFamilyFilterComponent } from "./templates-sub-family-filter.component";

const OPTIONS: SubFamilyOption[] = [
  { label: "All", value: "" },
  { label: "RTP Build", value: "rtp-build" },
];

async function renderComponent(searchTerm = "") {
  return render(TemplatesSubFamilyFilterComponent, {
    inputs: { options: OPTIONS, searchTerm },
    componentImports: [
      MockComponent(MxevolveSingleSelectDropdownComponent),
      Button,
      MockComponent(MxevolveIconComponent),
    ],
  });
}

function dropdown() {
  return ngMocks.find(MxevolveSingleSelectDropdownComponent);
}

describe("TemplatesSubFamilyFilterComponent", () => {
  it("renders the sub-family selector and template search", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-single-select-dropdown")
    ).toBeTruthy();
    expect(screen.getByLabelText("Search templates")).toBeTruthy();
  });

  it("passes the available options to the sub-family selector", async () => {
    await renderComponent();

    expect(ngMocks.input(dropdown(), "dataParams")).toEqual({
      options: OPTIONS,
    });
  });

  it("emits the selected sub-family", async () => {
    const { fixture } = await renderComponent();
    const selected = jest.fn();
    fixture.componentInstance.subFamilyChange.subscribe(selected);

    dropdown().componentInstance.selectionChange.emit(OPTIONS[1]);

    expect(selected).toHaveBeenCalledWith(OPTIONS[1]);
  });

  it("emits the entered template search term", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const changed = jest.fn();
    fixture.componentInstance.searchChange.subscribe(changed);

    await user.type(screen.getByLabelText("Search templates"), "RTP");

    expect(changed).toHaveBeenLastCalledWith("RTP");
  });

  it("does not show the clear search action when the search is empty", async () => {
    await renderComponent();

    expect(
      screen.queryByRole("button", { name: "Clear template search" })
    ).toBeNull();
  });

  it("clears the template search", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent("RTP");
    const changed = jest.fn();
    fixture.componentInstance.searchChange.subscribe(changed);

    await user.click(
      screen.getByRole("button", { name: "Clear template search" })
    );

    expect(changed).toHaveBeenCalledWith("");
  });
});
