import { ScenarioRunsSummaryAggregationService } from "./scenario-runs-summary-aggregation.service";
import type { ScenarioRunApiResponse } from "@mxevolve/domains/test/data-access";

function createRun(
  overrides: Partial<ScenarioRunApiResponse> = {}
): ScenarioRunApiResponse {
  return {
    id: "run-1",
    name: "test",
    status: "Passed",
    analysisStatus: "NA",
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-01-01T01:00:00Z",
    commitId: "abc",
    assignee: "user",
    mxVersion: "1.0",
    mxBuildId: "b1",
    envInfo: { environmentId: "env-1", status: "READY" },
    detections: {
      binaryImpactIds: [],
      configurationImpactIds: [],
      binaryRegressionIds: [],
      configurationRegressionIds: [],
      failureReasonIds: [],
    },
    linkedIncidents: [],
    ...overrides,
  };
}

describe("ScenarioRunsSummaryAggregationService", () => {
  let service: ScenarioRunsSummaryAggregationService;

  beforeEach(() => {
    service = new ScenarioRunsSummaryAggregationService();
  });

  describe("aggregateAnalysisStatuses", () => {
    it("returns all zeros for empty runs", () => {
      const result = service.aggregateAnalysisStatuses([], new Set());

      expect(result).toEqual({
        notStarted: 0,
        na: 0,
        assigned: 0,
        underAnalysis: 0,
        incidentSent: 0,
        done: 0,
        passed: 0,
        failed: 0,
        cancelled: 0,
      });
    });

    it("counts NA as Not Started", () => {
      const runs = [createRun({ id: "r1", analysisStatus: "NA" })];
      const result = service.aggregateAnalysisStatuses(runs, new Set(["r1"]));

      expect(result.notStarted).toBe(1);
    });

    it("counts Assigned as Not Started and Under Analysis separately", () => {
      const runs = [
        createRun({ id: "r1", analysisStatus: "Assigned" }),
        createRun({ id: "r2", analysisStatus: "Under Analysis" }),
        createRun({ id: "r3", analysisStatus: "Under Analysis" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["r1", "r2", "r3"])
      );

      expect(result.notStarted).toBe(1);
      expect(result.assigned).toBe(1);
      expect(result.underAnalysis).toBe(2);
    });

    it("counts Incident Sent separately", () => {
      const runs = [
        createRun({ id: "r1", analysisStatus: "Incident Sent" }),
        createRun({ id: "r2", analysisStatus: "Incident Sent" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["r1", "r2"])
      );

      expect(result.incidentSent).toBe(2);
    });

    it("sums Passed, Failed, and Cancelled into done", () => {
      const runs = [
        createRun({ id: "r1", analysisStatus: "Passed" }),
        createRun({ id: "r2", analysisStatus: "Failed" }),
        createRun({ id: "r3", analysisStatus: "Cancelled" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["r1", "r2", "r3"])
      );

      expect(result.done).toBe(3);
    });

    it("tracks Passed sub-count individually", () => {
      const runs = [
        createRun({ id: "r1", analysisStatus: "Passed" }),
        createRun({ id: "r2", analysisStatus: "Passed" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["r1", "r2"])
      );

      expect(result.passed).toBe(2);
    });

    it("tracks Failed sub-count individually", () => {
      const runs = [createRun({ id: "r1", analysisStatus: "Failed" })];
      const result = service.aggregateAnalysisStatuses(runs, new Set(["r1"]));

      expect(result.failed).toBe(1);
    });

    it("tracks Cancelled sub-count individually", () => {
      const runs = [
        createRun({ id: "r1", analysisStatus: "Cancelled" }),
        createRun({ id: "r2", analysisStatus: "Cancelled" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["r1", "r2"])
      );

      expect(result.cancelled).toBe(2);
    });

    it("aggregates multiple statuses from different runs", () => {
      const runs = [
        createRun({ id: "r1", analysisStatus: "NA" }),
        createRun({ id: "r2", analysisStatus: "Assigned" }),
        createRun({ id: "r3", analysisStatus: "Passed" }),
        createRun({ id: "r4", analysisStatus: "Failed" }),
        createRun({ id: "r5", analysisStatus: "Incident Sent" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["r1", "r2", "r3", "r4", "r5"])
      );

      expect(result.notStarted).toBe(2);
      expect(result.underAnalysis).toBe(0);
      expect(result.incidentSent).toBe(1);
      expect(result.done).toBe(2);
    });

    it("only counts runs whose ID is in the headRunIds set", () => {
      const runs = [
        createRun({ id: "head-1", analysisStatus: "Passed" }),
        createRun({ id: "retry-1", analysisStatus: "Failed" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["head-1"])
      );

      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it("ignores retries not in headRunIds", () => {
      const runs = [
        createRun({ id: "head-login", analysisStatus: "Passed" }),
        createRun({ id: "retry-login", analysisStatus: "Failed" }),
        createRun({ id: "head-checkout", analysisStatus: "Under Analysis" }),
        createRun({ id: "retry-checkout", analysisStatus: "NA" }),
      ];
      const result = service.aggregateAnalysisStatuses(
        runs,
        new Set(["head-login", "head-checkout"])
      );

      expect(result.passed).toBe(1);
      expect(result.underAnalysis).toBe(1);
      expect(result.notStarted).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("ignores retries for analysis status but uses all runs for detections", () => {
      const runs = [
        createRun({
          id: "retry-1",
          analysisStatus: "Failed",
          detections: {
            binaryImpactIds: ["bi-1"],
            configurationImpactIds: [],
            binaryRegressionIds: [],
            configurationRegressionIds: [],
            failureReasonIds: ["fr-1"],
          },
        }),
        createRun({
          id: "head-1",
          analysisStatus: "Passed",
          detections: {
            binaryImpactIds: ["bi-2"],
            configurationImpactIds: [],
            binaryRegressionIds: [],
            configurationRegressionIds: [],
            failureReasonIds: ["fr-2"],
          },
        }),
      ];

      const analysisResult = service.aggregateAnalysisStatuses(
        runs,
        new Set(["head-1"])
      );
      expect(analysisResult.passed).toBe(1);
      expect(analysisResult.failed).toBe(0);

      const detectionsResult = service.aggregateDetections(runs);
      expect(detectionsResult.impactCount).toBe(2);
      expect(detectionsResult.wasteReasonCount).toBe(2);
    });
  });

  describe("aggregateDetections", () => {
    it("returns all zeros for empty runs", () => {
      const result = service.aggregateDetections([]);

      expect(result).toEqual({
        wasteReasonCount: 0,
        regressionCount: 0,
        impactCount: 0,
      });
    });

    it("counts distinct failure reason IDs as waste reasons", () => {
      const result = service.aggregateDetections([
        createRun({
          detections: {
            binaryImpactIds: [],
            configurationImpactIds: [],
            binaryRegressionIds: [],
            configurationRegressionIds: [],
            failureReasonIds: ["fr-1", "fr-2"],
          },
        }),
      ]);

      expect(result.wasteReasonCount).toBe(2);
    });

    it("deduplicates detection IDs across runs", () => {
      const result = service.aggregateDetections([
        createRun({
          detections: {
            binaryImpactIds: [],
            configurationImpactIds: [],
            binaryRegressionIds: [],
            configurationRegressionIds: [],
            failureReasonIds: ["fr-1", "fr-2"],
          },
        }),
        createRun({
          detections: {
            binaryImpactIds: [],
            configurationImpactIds: [],
            binaryRegressionIds: [],
            configurationRegressionIds: [],
            failureReasonIds: ["fr-2", "fr-3"],
          },
        }),
      ]);

      expect(result.wasteReasonCount).toBe(3);
    });

    it("combines binary and configuration regressions", () => {
      const result = service.aggregateDetections([
        createRun({
          detections: {
            binaryImpactIds: [],
            configurationImpactIds: [],
            binaryRegressionIds: ["br-1"],
            configurationRegressionIds: ["cr-1", "cr-2"],
            failureReasonIds: [],
          },
        }),
      ]);

      expect(result.regressionCount).toBe(3);
    });

    it("combines binary and configuration impacts", () => {
      const result = service.aggregateDetections([
        createRun({
          detections: {
            binaryImpactIds: ["bi-1", "bi-2"],
            configurationImpactIds: ["ci-1"],
            binaryRegressionIds: [],
            configurationRegressionIds: [],
            failureReasonIds: [],
          },
        }),
      ]);

      expect(result.impactCount).toBe(3);
    });

    it("handles runs with missing detections gracefully", () => {
      const run = createRun({
        detections:
          undefined as unknown as ScenarioRunApiResponse["detections"],
      });

      const result = service.aggregateDetections([run]);

      expect(result).toEqual({
        wasteReasonCount: 0,
        regressionCount: 0,
        impactCount: 0,
      });
    });
  });

  describe("aggregateIncidents", () => {
    it("returns all zeros for empty runs", () => {
      const result = service.aggregateIncidents([]);

      expect(result).toEqual({
        openCount: 0,
        closedCount: 0,
        totalCount: 0,
        openBreakdown: [],
      });
    });

    it("classifies CLOSED status as closed", () => {
      const result = service.aggregateIncidents([
        createRun({
          linkedIncidents: [
            {
              id: "i-1",
              title: "t",
              status: "CLOSED",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.closedCount).toBe(1);
    });

    it("classifies DUPLICATE status as closed", () => {
      const result = service.aggregateIncidents([
        createRun({
          linkedIncidents: [
            {
              id: "i-1",
              title: "t",
              status: "DUPLICATE",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.closedCount).toBe(1);
    });

    it("classifies CANCEL status as closed", () => {
      const result = service.aggregateIncidents([
        createRun({
          linkedIncidents: [
            {
              id: "i-1",
              title: "t",
              status: "CANCEL",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.closedCount).toBe(1);
    });

    it("classifies other statuses as open", () => {
      const result = service.aggregateIncidents([
        createRun({
          linkedIncidents: [
            {
              id: "i-1",
              title: "t",
              status: "OPEN",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.openCount).toBe(1);
    });

    it("calculates total from all runs", () => {
      const result = service.aggregateIncidents([
        createRun({
          linkedIncidents: [
            {
              id: "i-1",
              title: "t",
              status: "OPEN",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
            },
            {
              id: "i-2",
              title: "t2",
              status: "CLOSED",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-2", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
        createRun({
          linkedIncidents: [
            {
              id: "i-3",
              title: "t3",
              status: "IN_PROGRESS",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-3", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.totalCount).toBe(3);
    });

    it("provides breakdown of open incident statuses", () => {
      const result = service.aggregateIncidents([
        createRun({
          linkedIncidents: [
            {
              id: "i-1",
              title: "t",
              status: "OPEN",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
            },
            {
              id: "i-2",
              title: "t2",
              status: "IN_PROGRESS",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-2", origin: "JIRA", link: "https://x" },
            },
            {
              id: "i-3",
              title: "t3",
              status: "OPEN",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-3", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.openBreakdown).toEqual(
        expect.arrayContaining([
          { name: "OPEN", count: 2 },
          { name: "IN_PROGRESS", count: 1 },
        ])
      );
    });

    it("handles runs with empty linkedIncidents", () => {
      const result = service.aggregateIncidents([
        createRun({ linkedIncidents: [] }),
      ]);

      expect(result.totalCount).toBe(0);
    });

    it("deduplicates incidents with the same ID across runs", () => {
      const sharedIncident = {
        id: "i-shared",
        title: "Shared Bug",
        status: "OPEN",
        assignee: "a",
        reporter: "r",
        creationDate: "2025-01-01",
        externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
      };

      const result = service.aggregateIncidents([
        createRun({ linkedIncidents: [sharedIncident] }),
        createRun({
          linkedIncidents: [
            sharedIncident,
            {
              id: "i-unique",
              title: "Unique Bug",
              status: "CLOSED",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-2", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.totalCount).toBe(2);
      expect(result.openCount).toBe(1);
      expect(result.closedCount).toBe(1);
    });

    it("normalizes status case for closed classification", () => {
      const result = service.aggregateIncidents([
        createRun({
          linkedIncidents: [
            {
              id: "i-1",
              title: "t",
              status: "Closed",
              assignee: "a",
              reporter: "r",
              creationDate: "2025-01-01",
              externalIssue: { id: "e-1", origin: "JIRA", link: "https://x" },
            },
          ],
        }),
      ]);

      expect(result.closedCount).toBe(1);
    });
  });
});
