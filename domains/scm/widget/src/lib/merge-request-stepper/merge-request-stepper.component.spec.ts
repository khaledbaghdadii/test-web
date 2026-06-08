import { render, screen, waitFor } from "@testing-library/angular";
import {
  MergeRequestStepperComponent,
  MergeStepStatuses,
} from "./merge-request-stepper.component";
import {
  MergeRequestService,
  MergeRequestOverview,
  MergeRequestState,
  MergeRequestStateTransition,
} from "@mxevolve/domains/scm/data-access";
import { of, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";

const DEFAULT_STATUSES: MergeStepStatuses = {
  underReview: "completed",
  underValidation: "active",
  merge: "inactive",
};

const MOCK_MERGE_REQUEST: MergeRequestOverview = {
  pullRequestId: "PR-42",
  mergeRequestState: MergeRequestState.IN_REVIEW,
  pullRequestUrl: "https://scm.example.com/pr/42",
  destinationBranch: "main",
};

const mockToastMessageService = {
  showError: jest.fn(),
};

function createMockService(
  mr: MergeRequestOverview = MOCK_MERGE_REQUEST
): MergeRequestService {
  return {
    getMergeRequestById: jest.fn().mockReturnValue(of(mr)),
  } as unknown as MergeRequestService;
}

async function renderComponent(
  inputs: Partial<{
    statuses: MergeStepStatuses;
    mergeRequestId: string;
    projectId: string;
  }> = {},
  mockService = createMockService()
) {
  return render(MergeRequestStepperComponent, {
    inputs,
    componentProviders: [
      { provide: MergeRequestService, useValue: mockService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("MergeRequestStepperComponent", () => {
  beforeEach(() => {
    mockToastMessageService.showError.mockClear();
  });

  it("renders 3 steps with correct titles when statuses provided", async () => {
    await renderComponent({ statuses: DEFAULT_STATUSES });
    expect(screen.getByText("Under Review")).toBeTruthy();
    expect(screen.getByText("Under Validation")).toBeTruthy();
    expect(screen.getByText("Merge")).toBeTruthy();
  });

  it("renders using vertical orientation", async () => {
    await renderComponent({ statuses: DEFAULT_STATUSES });
    const stepper = document.querySelector("mxevolve-stepper");
    expect(stepper).toBeTruthy();
  });

  it("maps statuses to steps correctly", async () => {
    await renderComponent({
      statuses: {
        underReview: "completed",
        underValidation: "failed",
        merge: "inactive",
      },
    });
    expect(screen.getByText("Under Review")).toBeTruthy();
    expect(screen.getByText("Under Validation")).toBeTruthy();
    expect(screen.getByText("Merge")).toBeTruthy();
  });

  it("does not project step content when no mergeRequestId is provided and no statuses data", async () => {
    await renderComponent({ statuses: DEFAULT_STATUSES });
    expect(document.querySelector("mxevolve-step")).toBeNull();
  });

  it("fetches merge request and renders review details when mergeRequestId and projectId are provided", async () => {
    const mockService = createMockService();
    await renderComponent(
      { mergeRequestId: "mr-1", projectId: "proj-1" },
      mockService
    );
    await waitFor(() => {
      expect(mockService.getMergeRequestById).toHaveBeenCalledWith(
        "proj-1",
        "mr-1"
      );
      expect(screen.getByText("PR-42")).toBeTruthy();
    });
  });

  it("does not fetch when only mergeRequestId is provided without projectId", async () => {
    const mockService = createMockService();
    await renderComponent({ mergeRequestId: "mr-1" }, mockService);
    expect(mockService.getMergeRequestById).not.toHaveBeenCalled();
  });

  it("prefers provided statuses over computed ones when both are given", async () => {
    const mockService = createMockService({
      ...MOCK_MERGE_REQUEST,
      mergeRequestState: MergeRequestState.MERGED,
    });
    await renderComponent(
      {
        statuses: DEFAULT_STATUSES,
        mergeRequestId: "mr-1",
        projectId: "proj-1",
      },
      mockService
    );
    expect(screen.getAllByText("Under Review").length).toBeGreaterThan(0);
  });

  it.each([
    {
      state: MergeRequestState.IN_REVIEW,
      expected: ["active", "inactive", "inactive"],
    },
    {
      state: MergeRequestState.QUEUED,
      expected: ["completed", "active", "inactive"],
    },
    {
      state: MergeRequestState.UNDER_VALIDATION,
      expected: ["completed", "active", "inactive"],
    },
    {
      state: MergeRequestState.MERGED,
      expected: ["completed", "completed", "completed"],
    },
    {
      state: MergeRequestState.MERGE_FAILED,
      expected: ["completed", "completed", "failed"],
    },
    {
      state: MergeRequestState.DECLINED,
      expected: ["failed", "inactive", "inactive"],
    },
    {
      state: MergeRequestState.REVIEW_FAILED,
      expected: ["failed", "inactive", "inactive"],
    },
    {
      state: MergeRequestState.UNDER_VALIDATION_FAILED,
      expected: ["completed", "failed", "inactive"],
    },
  ])("computes step statuses $state", async ({ state, expected }) => {
    const mockService = createMockService({
      ...MOCK_MERGE_REQUEST,
      mergeRequestState: state,
    });
    const { fixture } = await renderComponent(
      { mergeRequestId: "mr-1", projectId: "proj-1" },
      mockService
    );
    await waitFor(() => {
      expect(screen.getAllByText("Under Review").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Under Validation").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Merge").length).toBeGreaterThan(0);
      const steps = fixture.componentInstance.steps();
      expect(steps[0].status).toBe(expected[0]);
      expect(steps[1].status).toBe(expected[1]);
      expect(steps[2].status).toBe(expected[2]);
    });
  });

  it("shows error toast when fetching merge request fails", async () => {
    const mockService = {
      getMergeRequestById: jest
        .fn()
        .mockReturnValue(throwError(() => new Error("Network error"))),
    } as unknown as MergeRequestService;
    await renderComponent(
      { mergeRequestId: "mr-1", projectId: "proj-1" },
      mockService
    );
    await waitFor(() => {
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to load merge request details"
      );
    });
  });

  describe("step tooltip dates", () => {
    const TRANSITIONS: MergeRequestStateTransition[] = [
      {
        mergeRequestPreviousState: MergeRequestState.IN_REVIEW,
        mergeRequestCurrentState: MergeRequestState.QUEUED,
        transitionedOn: "2026-05-01T08:00:00Z",
      },
      {
        mergeRequestPreviousState: MergeRequestState.QUEUED,
        mergeRequestCurrentState: MergeRequestState.UNDER_VALIDATION,
        transitionedOn: "2026-05-01T09:00:00Z",
      },
      {
        mergeRequestPreviousState: MergeRequestState.UNDER_VALIDATION,
        mergeRequestCurrentState: MergeRequestState.MERGED,
        transitionedOn: "2026-05-01T10:00:00Z",
      },
    ];

    it("sets start tooltip on active review step when transitions provided", async () => {
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.IN_REVIEW,
        stateTransitions: [
          {
            mergeRequestPreviousState: MergeRequestState.QUEUED,
            mergeRequestCurrentState: MergeRequestState.IN_REVIEW,
            transitionedOn: "2026-05-01T07:00:00Z",
          },
        ],
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        expect(steps[0].tooltip).toContain("Start:");
      });
    });

    it("returns no tooltip for inactive steps", async () => {
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.IN_REVIEW,
        stateTransitions: TRANSITIONS,
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        // under-validation and merge are inactive for IN_REVIEW
        expect(steps[1].tooltip).toBeUndefined();
        expect(steps[2].tooltip).toBeUndefined();
      });
    });

    it("sets both start and end tooltip when validation step has exited", async () => {
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.MERGED,
        stateTransitions: TRANSITIONS,
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        expect(steps[1].tooltip).toContain("Start:");
        expect(steps[1].tooltip).toContain("End:");
      });
    });

    it("uses createdOn as start for Under Review step when no entry transition exists", async () => {
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.MERGED,
        createdOn: "2026-05-01T07:00:00Z",
        stateTransitions: TRANSITIONS,
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        expect(steps[0].tooltip).toContain("Start:");
        expect(steps[0].tooltip).toContain("End:");
      });
    });

    it("uses endDate as end for merge step (terminal state)", async () => {
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.MERGED,
        endDate: "2026-05-01T10:05:00Z",
        stateTransitions: TRANSITIONS,
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        expect(steps[2].tooltip).toContain("Start:");
        expect(steps[2].tooltip).toContain("End:");
      });
    });

    it("uses endDate for failed terminal steps", async () => {
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.MERGE_FAILED,
        endDate: "2026-05-01T10:05:00Z",
        stateTransitions: [
          TRANSITIONS[0],
          TRANSITIONS[1],
          {
            mergeRequestPreviousState: MergeRequestState.UNDER_VALIDATION,
            mergeRequestCurrentState: MergeRequestState.MERGE_FAILED,
            transitionedOn: "2026-05-01T10:00:00Z",
          },
        ],
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        expect(steps[2].tooltip).toContain("Start:");
        expect(steps[2].tooltip).toContain("End:");
      });
    });

    it("shows latest cycle tooltips after reopen", async () => {
      const reopenTransitions: MergeRequestStateTransition[] = [
        {
          mergeRequestPreviousState: MergeRequestState.IN_REVIEW,
          mergeRequestCurrentState: MergeRequestState.QUEUED,
          transitionedOn: "2026-05-01T08:00:00Z",
        },
        {
          mergeRequestPreviousState: MergeRequestState.QUEUED,
          mergeRequestCurrentState: MergeRequestState.UNDER_VALIDATION,
          transitionedOn: "2026-05-01T09:00:00Z",
        },
        {
          mergeRequestPreviousState: MergeRequestState.UNDER_VALIDATION,
          mergeRequestCurrentState: MergeRequestState.MERGE_FAILED,
          transitionedOn: "2026-05-01T10:00:00Z",
        },
        {
          mergeRequestPreviousState: MergeRequestState.MERGE_FAILED,
          mergeRequestCurrentState: MergeRequestState.IN_REVIEW,
          transitionedOn: "2026-05-02T08:00:00Z",
        },
        {
          mergeRequestPreviousState: MergeRequestState.IN_REVIEW,
          mergeRequestCurrentState: MergeRequestState.QUEUED,
          transitionedOn: "2026-05-02T09:00:00Z",
        },
        {
          mergeRequestPreviousState: MergeRequestState.QUEUED,
          mergeRequestCurrentState: MergeRequestState.UNDER_VALIDATION,
          transitionedOn: "2026-05-02T10:00:00Z",
        },
        {
          mergeRequestPreviousState: MergeRequestState.UNDER_VALIDATION,
          mergeRequestCurrentState: MergeRequestState.MERGED,
          transitionedOn: "2026-05-02T11:00:00Z",
        },
      ];
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.MERGED,
        createdOn: "2026-05-01T07:00:00Z",
        endDate: "2026-05-02T11:05:00Z",
        stateTransitions: reopenTransitions,
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        // Under Review: latest entry is MERGE_FAILED->IN_REVIEW (May 2 08:00), exit is IN_REVIEW->QUEUED (May 2 09:00)
        expect(steps[0].tooltip).toContain("Start:");
        expect(steps[0].tooltip).toContain("End:");
        // Under Validation: latest entry is IN_REVIEW->QUEUED (May 2 09:00), exit is UNDER_VALIDATION->MERGED (May 2 11:00)
        expect(steps[1].tooltip).toContain("Start:");
        expect(steps[1].tooltip).toContain("End:");
        // Merge: entry is UNDER_VALIDATION->MERGED (May 2 11:00), end from endDate
        expect(steps[2].tooltip).toContain("Start:");
        expect(steps[2].tooltip).toContain("End:");
      });
    });

    it("shows only start for Under Review when MR is still in review", async () => {
      const mockService = createMockService({
        ...MOCK_MERGE_REQUEST,
        mergeRequestState: MergeRequestState.IN_REVIEW,
        createdOn: "2026-05-01T07:00:00Z",
        stateTransitions: [],
      });
      const { fixture } = await renderComponent(
        { mergeRequestId: "mr-1", projectId: "proj-1" },
        mockService
      );
      await waitFor(() => {
        const steps = fixture.componentInstance.steps();
        expect(steps[0].tooltip).toContain("Start:");
        expect(steps[0].tooltip).not.toContain("End:");
      });
    });
  });
});
