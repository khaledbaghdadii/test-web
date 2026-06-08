import { ProjectUrlPipe } from "./project-url.pipe";
import { TestBed } from "@angular/core/testing";
import { ProjectUriFactoryService } from "./project-uri-factory.service";

describe("ProjectUrlPipe", () => {
  let pipe: ProjectUrlPipe;
  let projectUriFactoryService: jest.Mocked<ProjectUriFactoryService>;

  beforeEach(() => {
    projectUriFactoryService = {
      constructProjectBaseUri: jest.fn(),
    } as jest.Mocked<ProjectUriFactoryService>;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectUriFactoryService,
          useValue: projectUriFactoryService,
        },
        ProjectUrlPipe,
      ],
    });

    pipe = TestBed.inject(ProjectUrlPipe);
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should return the url of a project correctly", () => {
    const projectId = "projectId";
    const projectUrl = "projectUrl";
    projectUriFactoryService.constructProjectBaseUri.mockReturnValue(
      projectUrl
    );

    const url = pipe.transform(projectId);
    expect(url).toEqual(projectUrl);
    expect(
      projectUriFactoryService.constructProjectBaseUri
    ).toHaveBeenCalledWith(projectId);
  });
});
