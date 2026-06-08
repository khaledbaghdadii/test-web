import { TestBed } from "@angular/core/testing";
import { ANALYTICS_MFE_PATH } from "@mxflow/config";
import { AnalyticsUriFactoryPipe } from "./analytics-uri-factory.pipe";
import { ProjectUrlPipe } from "@mxflow/features/project";

const projectId = "projectId";
const projectUrl = "projectUrl";

describe("AnalyticsUriFactoryPipe", () => {
  let pipe: AnalyticsUriFactoryPipe;
  let mockProjectUrlPipe: ProjectUrlPipe;

  beforeEach(() => {
    mockProjectUrlPipe = {
      transform: jest.fn(() => projectUrl),
    } as unknown as ProjectUrlPipe;

    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectUrlPipe, useValue: mockProjectUrlPipe },
        AnalyticsUriFactoryPipe,
      ],
    });

    pipe = TestBed.inject(AnalyticsUriFactoryPipe);
  });

  it("should construct analytics uri correctly", () => {
    const resource = "beep-boop";
    const uri = pipe.transform(resource, projectId);

    expect(mockProjectUrlPipe.transform).toHaveBeenCalledWith(projectId);
    expect(uri).toEqual(`${projectUrl}/${ANALYTICS_MFE_PATH}/${resource}`);
  });
});
