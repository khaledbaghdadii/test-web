import { MockBuilder, ngMocks } from "ng-mocks";
import { TestExecutionFailureRedirector } from "./test-execution-failure-redirector";
import { WorkItemRedirectionRegistryService } from "../../../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { DestroyableInjector, Injector } from "@angular/core";
import { TestUnitUriFactoryPipe } from "@mxflow/test-management";
import { WorkItem } from "@mxflow/features/work-item-management";

describe("TestExecutionFailureRedirector", () => {
  let redirector: TestExecutionFailureRedirector;
  let registryService: jest.Mocked<WorkItemRedirectionRegistryService>;
  let testUnitUriFactoryPipe: { transform: jest.Mock };
  let injector: DestroyableInjector;
  let windowOpenSpy: jest.SpyInstance;

  const mockWorkItem = {
    metadata: { testUnitId: "unit-123" },
    projectId: "proj-456",
  } as unknown as WorkItem;

  beforeEach(async () => {
    testUnitUriFactoryPipe = { transform: jest.fn() };

    await MockBuilder(TestExecutionFailureRedirector)
      .mock(WorkItemRedirectionRegistryService)
      .mock(TestUnitUriFactoryPipe, testUnitUriFactoryPipe);

    registryService = ngMocks.findInstance(
      WorkItemRedirectionRegistryService
    ) as jest.Mocked<WorkItemRedirectionRegistryService>;

    registryService.registerHandler = jest.fn();

    injector = {
      get: () => testUnitUriFactoryPipe,
      destroy: jest.fn(),
    } as DestroyableInjector;
    jest.spyOn(Injector, "create").mockReturnValue(injector);

    redirector = ngMocks.findInstance(TestExecutionFailureRedirector);
    windowOpenSpy = jest.spyOn(window, "open").mockImplementation();
  });

  it("should register itself in the registry service upon construction", () => {
    expect(registryService.registerHandler).toHaveBeenCalledWith(
      "test",
      "test_execution_failure",
      redirector
    );
  });

  it("should call the test unit uri factory with the correct params", () => {
    testUnitUriFactoryPipe.transform.mockReturnValue("https://test-url");
    redirector.redirect(mockWorkItem);
    expect(testUnitUriFactoryPipe.transform).toHaveBeenCalledWith(
      "unit-123",
      "proj-456"
    );
  });

  it("should open the test unit uri in a new tab", () => {
    testUnitUriFactoryPipe.transform.mockReturnValue("https://test-url");
    redirector.redirect(mockWorkItem);
    expect(windowOpenSpy).toHaveBeenCalledWith("https://test-url", "_blank");
  });
});
