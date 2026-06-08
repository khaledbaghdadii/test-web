import { of } from "rxjs";
import { ProjectService } from "../../project.service";
import { Project } from "../../project";
import { ProjectViewDataProvider } from "./project-view-data-provider";

describe("ProjectViewDataProvider", () => {
  let dataProvider: ProjectViewDataProvider;
  let mockProjectService: jest.Mocked<ProjectService>;

  const PROJECT: Project = {
    id: "1",
    name: "Project 1",
    description: "First project",
  };

  beforeEach(() => {
    mockProjectService = {
      getViewProjects: jest.fn().mockReturnValue(of([PROJECT])),
    } as unknown as jest.Mocked<ProjectService>;

    dataProvider = new ProjectViewDataProvider(mockProjectService);
  });

  it("should fetch view projects from service", async () => {
    const projects = await new Promise<Project[]>((resolve) => {
      dataProvider.fetchData().subscribe((result) => resolve(result));
    });

    expect(projects).toEqual([PROJECT]);
    expect(mockProjectService.getViewProjects).toHaveBeenCalled();
  });

  it("should convert project to dropdown option", () => {
    const option = dataProvider.toDropdownOption(PROJECT);

    expect(option).toEqual({
      label: "Project 1",
      value: PROJECT,
    });
  });

  it("should return project id as item id", () => {
    expect(dataProvider.getItemId(PROJECT)).toBe("1");
  });
});
