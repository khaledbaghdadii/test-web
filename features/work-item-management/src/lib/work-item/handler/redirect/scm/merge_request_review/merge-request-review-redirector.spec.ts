import { TestBed } from "@angular/core/testing";
import { MergeRequestReviewRedirector } from "./merge-request-review-redirector";
import {
  WorkItemRedirectionRegistryService,
  WorkItem,
} from "@mxflow/features/work-item-management";
import { IntegrateChangesUriFactoryService } from "@mxflow/features/business-process";

describe("MergeRequestReviewRedirector", () => {
  let redirector: MergeRequestReviewRedirector;
  let windowOpenSpy: jest.SpyInstance;

  const mockWorkItemRedirectionRegistryService = {
    registerHandler: jest.fn(),
  };

  const mockIntegrateChangesUriFactoryService = {
    constructIntegrateChangesUri: jest.fn(),
  };

  function createWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
    return {
      projectId: "proj1",
      businessProcesses: [],
      metadata: {},
      ...overrides,
    } as WorkItem;
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockIntegrateChangesUriFactoryService.constructIntegrateChangesUri.mockReturnValue(
      null
    );

    windowOpenSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    TestBed.configureTestingModule({
      providers: [
        MergeRequestReviewRedirector,
        {
          provide: WorkItemRedirectionRegistryService,
          useValue: mockWorkItemRedirectionRegistryService,
        },
        {
          provide: IntegrateChangesUriFactoryService,
          useValue: mockIntegrateChangesUriFactoryService,
        },
      ],
    });

    redirector = TestBed.inject(MergeRequestReviewRedirector);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it("should register with registry service", () => {
    expect(
      mockWorkItemRedirectionRegistryService.registerHandler
    ).toHaveBeenCalledWith("scm", "merge_request_review", redirector);
  });

  it.each([
    [
      "bp1",
      "user-story-build-and-test",
      "/app/proj1/business-process/build-and-test-processes/execution/bp1/integrate-changes",
    ],
    [
      "bp2",
      "master-validation",
      "/app/proj1/business-process/validation-processes/execution/bp2/integrate-fixes",
    ],
    [
      "bp3",
      "binary-upgrade",
      "/app/proj1/business-process/upgrade-processes/execution/bp3?step=merge",
    ],
  ])(
    "should open constructed redirect url",
    (businessProcessId, familyId, constructedUrl) => {
      mockIntegrateChangesUriFactoryService.constructIntegrateChangesUri.mockReturnValue(
        constructedUrl
      );

      const workItem = createWorkItem({
        businessProcesses: [{ id: businessProcessId, familyId }],
      });

      redirector.redirect(workItem);

      expect(
        mockIntegrateChangesUriFactoryService.constructIntegrateChangesUri
      ).toHaveBeenCalledWith(businessProcessId, familyId, "proj1");
      expect(windowOpenSpy).toHaveBeenCalledWith(constructedUrl, "_blank");
    }
  );

  it("should not redirect when family id is unsupported", () => {
    mockIntegrateChangesUriFactoryService.constructIntegrateChangesUri.mockReturnValue(
      null
    );

    const workItem = createWorkItem({
      businessProcesses: [{ id: "bp4", familyId: "unknown-family" }],
    });

    redirector.redirect(workItem);

    expect(
      mockIntegrateChangesUriFactoryService.constructIntegrateChangesUri
    ).toHaveBeenCalledWith("bp4", "unknown-family", "proj1");
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("should not redirect when familyId is undefined", () => {
    const workItem = createWorkItem({
      businessProcesses: [
        { id: "bp6" } as WorkItem["businessProcesses"][number],
      ],
    });

    redirector.redirect(workItem);

    expect(
      mockIntegrateChangesUriFactoryService.constructIntegrateChangesUri
    ).not.toHaveBeenCalled();
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });
});
