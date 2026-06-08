import { of, lastValueFrom } from "rxjs";
import {
  RtpCommitIdDataProvider,
  RtpCommitIdDataParams,
} from "./rtp-commit-id-data-provider";
import { ValidationProcessExecutionFetcherService } from "../validation-process-execution-fetcher/validation-process-execution-fetcher.service";
import { ValidationProcessExecution } from "../validation-process-execution-fetcher/model";

describe("RTP commit Id data provider", () => {
  let provider: RtpCommitIdDataProvider;
  let fetcherService: Partial<ValidationProcessExecutionFetcherService>;

  const params: RtpCommitIdDataParams = {
    projectId: "projectId",
    parentBranch: "parentBranch",
  };

  beforeEach(() => {
    fetcherService = {
      getValidationProcessExecutions: jest.fn(() =>
        of({
          executions: [getValidationProcessExecution()],
          total: 0,
          last: true,
        })
      ),
    };

    provider = new RtpCommitIdDataProvider(
      fetcherService as ValidationProcessExecutionFetcherService
    );
  });

  it("should fetch data with correct filters", async () => {
    await lastValueFrom(provider.fetchData(params, 0, 100));

    expect(fetcherService.getValidationProcessExecutions).toHaveBeenCalledWith(
      "projectId",
      {
        page: 0,
        pageSize: 100,
        parentBranch: "parentBranch",
        officiality: ["OFFICIAL", "NA"],
        businessProcessQualityLevel: ["MQG"],
        statuses: ["PASSED", "FAILED", "ABORTED"],
        rtpCommitPhrase: undefined,
      }
    );
  });

  it("should pass searchKey as rtpCommitPhrase", async () => {
    await lastValueFrom(provider.fetchData(params, 0, 100, "abc123"));

    expect(fetcherService.getValidationProcessExecutions).toHaveBeenCalledWith(
      "projectId",
      {
        page: 0,
        pageSize: 100,
        parentBranch: "parentBranch",
        officiality: ["OFFICIAL", "NA"],
        businessProcessQualityLevel: ["MQG"],
        statuses: ["PASSED", "FAILED", "ABORTED"],
        rtpCommitPhrase: "abc123",
      }
    );
  });

  it("should extract rtpCommitId from input", async () => {
    const result = await lastValueFrom(provider.fetchData(params, 0, 100));

    expect(result.content).toEqual(["rtpCommitId"]);
    expect(result.last).toBe(true);
  });

  it("given executions with duplicate commit ids, when fetching data, then it should deduplicate them", async () => {
    jest
      .spyOn(fetcherService, "getValidationProcessExecutions")
      .mockReturnValue(
        of({
          executions: [
            getValidationProcessExecution(),
            getValidationProcessExecution(),
            {
              input: { rtpCommitId: "other" },
            } as unknown as ValidationProcessExecution,
          ],
          total: 0,
          last: true,
        })
      );

    const result = await lastValueFrom(provider.fetchData(params, 0, 100));

    expect(result.content).toEqual(["rtpCommitId", "other"]);
  });

  it("should filter out executions without rtpCommitId", async () => {
    jest
      .spyOn(fetcherService, "getValidationProcessExecutions")
      .mockReturnValue(
        of({
          executions: [
            getValidationProcessExecution(),
            {
              input: { rtpCommitId: null },
            } as unknown as ValidationProcessExecution,
            {
              input: { rtpCommitId: undefined },
            } as unknown as ValidationProcessExecution,
          ],
          total: 0,
          last: true,
        })
      );

    const result = await lastValueFrom(provider.fetchData(params, 0, 100));

    expect(result.content).toEqual(["rtpCommitId"]);
  });

  it("should convert commit ID to dropdown option", () => {
    const option = provider.toDropdownOption("commitId");

    expect(option).toEqual({ label: "commitId", value: "commitId" });
  });

  it("should return the commit ID as the item ID", () => {
    expect(provider.getItemId("commitId")).toBe("commitId");
  });

  function getValidationProcessExecution(): ValidationProcessExecution {
    return {
      input: {
        rtpCommitId: "rtpCommitId",
      },
    } as ValidationProcessExecution;
  }
});
