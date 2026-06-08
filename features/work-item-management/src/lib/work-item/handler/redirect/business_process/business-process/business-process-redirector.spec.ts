import { TestBed } from "@angular/core/testing";
import { BusinessProcessRedirector } from "./business-process-redirector";
import { WorkItemRedirectionRegistryService } from "../../../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { WorkItem } from "../../../../model/work-item";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { BusinessProcessUriFactoryPipeModule } from "@mxflow/features/business-process";

describe("BusinessProcessRedirector Integration", () => {
  let redirector: BusinessProcessRedirector;
  let mockRegistry: jest.Mocked<WorkItemRedirectionRegistryService>;
  let windowOpenSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRegistry = {
      registerHandler: jest.fn(),
    } as any;

    windowOpenSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    await TestBed.configureTestingModule({
      imports: [BusinessProcessUriFactoryPipeModule],
      providers: [
        { provide: WorkItemRedirectionRegistryService, useValue: mockRegistry },
        ProjectUrlPipe,
        BusinessProcessRedirector,
      ],
    }).compileComponents();

    redirector = TestBed.inject(BusinessProcessRedirector);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it("should register with registry service", () => {
    expect(mockRegistry.registerHandler).toHaveBeenCalledWith(
      "business_process",
      "business_process",
      redirector
    );
  });

  it("should not redirect when businessProcesses is missing", () => {
    const workItem: WorkItem = {
      projectId: "project-456",
    } as WorkItem;

    redirector.redirect(workItem);

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("should redirect work item successfully", async () => {
    const workItem: WorkItem = {
      businessProcesses: [
        {
          id: "user-story-build-and-test__47a57786-4888-491a-ae0f-838c46aa8c04",
        },
      ],
      projectId: "project-456",
    } as WorkItem;

    redirector.redirect(workItem);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "/app/project-456/business-process/build-and-test-processes/execution/user-story-build-and-test__47a57786-4888-491a-ae0f-838c46aa8c04",
      "_blank"
    );
  });
});
