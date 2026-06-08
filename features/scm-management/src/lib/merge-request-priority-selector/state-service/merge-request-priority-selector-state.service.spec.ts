import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { MergeRequestPrioritySelectorStateService } from "./merge-request-priority-selector-state.service";
import {
  MergeRequest,
  MergeRequestPriority,
  MergeRequestService,
  MergeRequestState,
  MergeRequestStatus,
} from "@mxflow/features/scm-management";
import { delay, of, throwError, take } from "rxjs";
import { MergeRequestApiResponse } from "../../merge-request/model/response/merge-request-api-response";

const PROJECT_ID = "projectId";
const MERGE_REQUEST_ID = "mergeRequestId";

const MERGE_REQUEST = {
  id: MERGE_REQUEST_ID,
  projectId: PROJECT_ID,
  title: "merge request",
  development: {
    id: "1",
    name: "development",
    projectId: "1",
    repositoryId: "1",
  },
  mergeConfiguration: {
    id: "1",
    branchName: "branch",
    projectId: "1",
  },
  contextId: "1",
  pullRequestId: "1",
  pullRequestUrl: "url",
  mergeRequestStatus: MergeRequestStatus.IN_PROGRESS,
  mergeRequestState: MergeRequestState.IN_REVIEW,
} as MergeRequest;

describe("MergeRequestPrioritySelectorStateService", () => {
  let service: MergeRequestPrioritySelectorStateService;
  let mergeRequestServiceMock: jest.Mocked<MergeRequestService>;

  beforeEach(() => {
    mergeRequestServiceMock = {
      updateMergeRequestPriority: jest.fn(),
    } as unknown as jest.Mocked<MergeRequestService>;

    TestBed.configureTestingModule({
      providers: [
        MergeRequestPrioritySelectorStateService,
        { provide: MergeRequestService, useValue: mergeRequestServiceMock },
      ],
    });

    service = TestBed.inject(MergeRequestPrioritySelectorStateService);
  });

  it("should initialize with default state", () => {
    expect(service.isLoadingDataSignal()).toBe(false);
    expect(service.errorMessageSignal()).toBe("");
  });

  it("should emit correct project ID when set", (done) => {
    const id = "123";

    service.setProjectIdSubject(id);

    service["projectIdSubject"].pipe(take(1)).subscribe((value) => {
      expect(value).toBe(id);
      done();
    });
  });

  it("should emit correct merge request ID when set", (done) => {
    const id = "456";

    service.setMergeRequestIdSubject(id);

    service["mergeRequestIdSubject"].pipe(take(1)).subscribe((value) => {
      expect(value).toBe(id);
      done();
    });
  });

  it("should set merge request priority", () => {
    const priority = MergeRequestPriority.HIGH;
    service.setMergeRequestPrioritySubject(priority);
    service["mergeRequestPrioritySubject"].subscribe((value) => {
      expect(value).toBe(priority);
    });
  });

  it("should update merge request priority successfully and call onSuccess", fakeAsync(() => {
    const successCallback = jest.fn();
    mergeRequestServiceMock.updateMergeRequestPriority.mockReturnValueOnce(
      of(getMergeRequestApiResponse()).pipe(delay(100))
    );
    service.setProjectIdSubject(PROJECT_ID);
    service.setMergeRequestIdSubject(MERGE_REQUEST_ID);

    service.setMergeRequestPrioritySubject(
      MergeRequestPriority.LOW,
      successCallback
    );
    tick();

    expect(service.isLoadingDataSignal()).toBe(true);
    expect(
      mergeRequestServiceMock.updateMergeRequestPriority
    ).toHaveBeenCalledWith(
      PROJECT_ID,
      MERGE_REQUEST_ID,
      MergeRequestPriority.LOW
    );

    tick(100);
    expect(service.isLoadingDataSignal()).toBe(false);
    expect(successCallback).toHaveBeenCalled();
  }));

  it("should set error message and stop loading when update fails", fakeAsync(() => {
    const errorMessage = "Update failed";
    mergeRequestServiceMock.updateMergeRequestPriority.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );
    service.setProjectIdSubject("123");
    service.setMergeRequestIdSubject("456");

    service.setMergeRequestPrioritySubject(MergeRequestPriority.CRITICAL);
    tick();

    expect(service.errorMessageSignal()).toBe(errorMessage);
    expect(service.isLoadingDataSignal()).toBe(false);
  }));

  function getMergeRequestApiResponse(): MergeRequestApiResponse {
    return MERGE_REQUEST as MergeRequestApiResponse;
  }
});
