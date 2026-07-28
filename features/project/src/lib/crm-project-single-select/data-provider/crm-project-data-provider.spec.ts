import { of } from "rxjs";
import { ProjectService } from "../../project.service";
import { CrmProject } from "../../crm-project";
import { CrmProjectDataProvider } from "./crm-project-data-provider";

describe("CrmProjectDataProvider", () => {
  let dataProvider: CrmProjectDataProvider;
  let mockProjectService: jest.Mocked<ProjectService>;

  const PROJECT_ID = "project-1";
  const CRM_PROJECT: CrmProject = {
    id: "crm-1",
    projectId: PROJECT_ID,
    externalId: "EXT-1",
    name: "CRM Project 1",
  };

  beforeEach(() => {
    mockProjectService = {
      getCrmProjects: jest.fn().mockReturnValue(of([CRM_PROJECT])),
    } as unknown as jest.Mocked<ProjectService>;

    dataProvider = new CrmProjectDataProvider(mockProjectService);
  });

  it("should fetch CRM projects from service", async () => {
    const crmProjects = await new Promise<CrmProject[]>((resolve) => {
      dataProvider
        .fetchData({ projectId: PROJECT_ID })
        .subscribe((result) => resolve(result));
    });

    expect(crmProjects).toEqual([CRM_PROJECT]);
    expect(mockProjectService.getCrmProjects).toHaveBeenCalledWith(PROJECT_ID);
  });

  it("should convert CRM project to dropdown option", () => {
    const option = dataProvider.toDropdownOption(CRM_PROJECT);

    expect(option).toEqual({
      label: "CRM Project 1",
      value: CRM_PROJECT,
    });
  });

  it("should get item id from CRM project", () => {
    expect(dataProvider.getItemId(CRM_PROJECT)).toBe("crm-1");
  });
});
