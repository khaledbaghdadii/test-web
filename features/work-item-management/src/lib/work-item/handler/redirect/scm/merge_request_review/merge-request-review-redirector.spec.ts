import { TestBed } from "@angular/core/testing";
import { MergeRequestReviewRedirector } from "./merge-request-review-redirector";
import { WorkItemRedirectionRegistryService } from "../../../../services/work-item-redirection-registry/work-item-redirection-registry.service";
import { WorkItem } from "@mxflow/features/work-item-management";

describe("MergeRequestReviewRedirector", () => {
  let redirector: MergeRequestReviewRedirector;
  let mockRegistry: jest.Mocked<WorkItemRedirectionRegistryService>;
  let windowOpenSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRegistry = {
      registerHandler: jest.fn(),
    } as unknown as jest.Mocked<WorkItemRedirectionRegistryService>;

    windowOpenSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    await TestBed.configureTestingModule({
      providers: [
        { provide: WorkItemRedirectionRegistryService, useValue: mockRegistry },
        MergeRequestReviewRedirector,
      ],
    }).compileComponents();

    redirector = TestBed.inject(MergeRequestReviewRedirector);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it("should register with registry service", () => {
    expect(mockRegistry.registerHandler).toHaveBeenCalledWith(
      "scm",
      "merge_request_review",
      redirector
    );
  });

  it("should redirect when metadata pullRequestUrl exists", () => {
    const workItem: WorkItem = {
      metadata: {
        pullRequestUrl: "https://gitlab.example.com/project/merge_requests/123",
      },
    } as unknown as WorkItem;

    redirector.redirect(workItem);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://gitlab.example.com/project/merge_requests/123",
      "_blank"
    );
  });

  it("should not redirect when metadata is undefined", () => {
    const workItem: WorkItem = {} as WorkItem;

    redirector.redirect(workItem);

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("should not redirect when metadata exists but pullRequestUrl is undefined", () => {
    const workItem: WorkItem = {
      metadata: {
        otherProperty: "value",
      },
    } as unknown as WorkItem;

    redirector.redirect(workItem);

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("should not redirect when pullRequestUrl is not a string", () => {
    const workItem: WorkItem = {
      metadata: {
        pullRequestUrl: 123,
      },
    } as unknown as WorkItem;

    redirector.redirect(workItem);

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("should not redirect when pullRequestUrl is null", () => {
    const workItem: WorkItem = {
      metadata: {
        pullRequestUrl: null,
      },
    } as unknown as WorkItem;

    redirector.redirect(workItem);

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("should not redirect when pullRequestUrl is empty string", () => {
    const workItem: WorkItem = {
      metadata: {
        pullRequestUrl: "",
      },
    } as unknown as WorkItem;

    redirector.redirect(workItem);

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });
});
