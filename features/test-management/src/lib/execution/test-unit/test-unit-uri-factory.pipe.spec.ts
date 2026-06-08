import { TestUnitUriFactoryPipe } from "./test-unit-uri-factory.pipe";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { MockBuilder, ngMocks } from "ng-mocks";

const projectId = "projectId";
const testUnitId = "testUnitId";
describe("TestUnitUriFactoryPipe", () => {
  let pipe: TestUnitUriFactoryPipe;
  let projectUrlPipe: ProjectUrlPipe;

  beforeEach(() => {
    projectUrlPipe = {
      transform: jest.fn(() => `/app/${projectId}`),
    } as unknown as ProjectUrlPipe;

    return MockBuilder()
      .provide(TestUnitUriFactoryPipe)
      .provide({ provide: ProjectUrlPipe, useValue: projectUrlPipe });
  });

  beforeEach(() => {
    pipe = ngMocks.findInstance(TestUnitUriFactoryPipe);
  });

  it("should create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should return the correct test unit URI", () => {
    const result = pipe.transform(testUnitId, projectId);
    expect(result).toBe(`/app/${projectId}/test-unit/${testUnitId}`);
    expect(projectUrlPipe.transform).toHaveBeenCalledWith(projectId);
  });
});
