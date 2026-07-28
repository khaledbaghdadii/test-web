import { render, screen } from "@testing-library/angular";
import { of } from "rxjs";
import { ProjectUsersService } from "@mxevolve/domains/business-process/data-access";
import { ProjectUsersMultiselectComponent } from "./project-users-multiselect.component";

const mockProjectUsersService = {
  getProjectUsers: jest.fn(() =>
    of({
      content: [{ id: "u1", displayName: "Alice", mail: "alice@x.com" }],
      last: true,
    })
  ),
};

async function renderComponent() {
  return render(ProjectUsersMultiselectComponent, {
    inputs: { projectId: "project-1" },
    componentProviders: [
      { provide: ProjectUsersService, useValue: mockProjectUsersService },
    ],
  });
}

describe("ProjectUsersMultiselectComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders a multiselect users dropdown", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-multiselect-dropdown")
    ).toBeTruthy();
  });

  it("shows the Select Users placeholder", async () => {
    await renderComponent();

    expect(screen.getByText("Select Users")).toBeTruthy();
  });
});
