import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { Component } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { TestBed } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { ProjectService } from "@mxflow/features/project";
import { ProjectsDrawerComponent } from "./projects-drawer.component";

@Component({ template: "", standalone: true })
class BlankComponent {}

const MOCK_PROJECTS = [
  { id: "p1", name: "Alpha Project", description: "" },
  { id: "p2", name: "Beta Project", description: "" },
  { id: "p3", name: "Gamma Project", description: "" },
];

const mockProjectService = {
  getAllProjects: jest.fn(),
};

async function renderDrawer() {
  return render(ProjectsDrawerComponent, {
    inputs: { visible: true },
    providers: [
      provideRouter([{ path: "**", component: BlankComponent }]),
      { provide: ProjectService, useValue: mockProjectService },
    ],
  });
}

describe("ProjectsDrawerComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockProjectService.getAllProjects.mockReturnValue(of(MOCK_PROJECTS));
  });

  it("loads the projects when the drawer is shown", async () => {
    await renderDrawer();

    await waitFor(() => {
      expect(mockProjectService.getAllProjects).toHaveBeenCalled();
    });
  });

  it("displays the loaded project names", async () => {
    await renderDrawer();

    expect(await screen.findByText("Alpha Project")).toBeTruthy();
  });

  it("shows loading skeletons while the projects are being fetched", async () => {
    mockProjectService.getAllProjects.mockReturnValue(new Subject());

    const { container } = await renderDrawer();

    await waitFor(() => {
      expect(container.querySelector(".p-skeleton")).toBeTruthy();
    });
  });

  it("hides the empty message while the projects are being fetched", async () => {
    mockProjectService.getAllProjects.mockReturnValue(new Subject());

    const { container } = await renderDrawer();

    await waitFor(() => {
      expect(container.querySelector(".p-skeleton")).toBeTruthy();
    });
    expect(screen.queryByText("No projects found.")).toBeNull();
  });

  it("filters the project list by the search term", async () => {
    const user = userEvent.setup();
    await renderDrawer();

    await screen.findByText("Alpha Project");

    await user.type(screen.getByLabelText("Search projects"), "beta");

    await waitFor(() => {
      expect(screen.queryByText("Alpha Project")).toBeNull();
    });
  });

  it("keeps a matching project visible when filtering by the search term", async () => {
    const user = userEvent.setup();
    await renderDrawer();

    await screen.findByText("Alpha Project");

    await user.type(screen.getByLabelText("Search projects"), "beta");

    expect(await screen.findByText("Beta Project")).toBeTruthy();
  });

  it("navigates to the selected project", async () => {
    const user = userEvent.setup();
    await renderDrawer();
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, "navigate");

    await user.click(await screen.findByText("Alpha Project"));

    expect(navigateSpy).toHaveBeenCalledWith(["/app", "p1"]);
  });

  it("shows an empty message when no projects match the search", async () => {
    const user = userEvent.setup();
    await renderDrawer();

    await screen.findByText("Alpha Project");

    await user.type(
      screen.getByLabelText("Search projects"),
      "no-such-project"
    );

    expect(await screen.findByText("No projects found.")).toBeTruthy();
  });
});
