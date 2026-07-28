import { render, screen } from "@testing-library/angular";
import { of } from "rxjs";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { GroupDropdownSelectionComponent } from "./group-dropdown-selection.component";

const mockGroupService = {
  searchGroups: jest.fn(() =>
    of({
      content: [{ id: "g1", name: "Group One", projectId: "project-1" }],
      last: true,
    })
  ),
};

async function renderComponent() {
  return render(GroupDropdownSelectionComponent, {
    inputs: { projectId: "project-1" },
    componentProviders: [
      { provide: InfraGroupService, useValue: mockGroupService },
    ],
  });
}

describe("GroupDropdownSelectionComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders a single-select infra group dropdown", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-single-select-dropdown")
    ).toBeTruthy();
    expect(document.querySelector("p-select")).toBeTruthy();
  });

  it("shows the Select Group placeholder", async () => {
    await renderComponent();

    expect(screen.getByText("Select Group")).toBeTruthy();
  });
});
