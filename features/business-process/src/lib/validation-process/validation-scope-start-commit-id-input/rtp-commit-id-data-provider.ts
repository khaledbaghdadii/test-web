import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import { ValidationProcessExecutionFetcherService } from "../validation-process-execution-fetcher/validation-process-execution-fetcher.service";
import { BusinessProcessExecutionStatus } from "../../business-process-execution-status/business-process-execution-status";
import { BusinessProcessOfficialStatus } from "../../business-process-official-status/business-process-official-status";

export interface RtpCommitIdDataParams {
  projectId: string;
  parentBranch: string;
}

export class RtpCommitIdDataProvider
  implements MxEvolveDropdownDataProvider<string, RtpCommitIdDataParams>
{
  private static readonly TERMINAL_STATUSES = [
    BusinessProcessExecutionStatus.PASSED,
    BusinessProcessExecutionStatus.FAILED,
    BusinessProcessExecutionStatus.ABORTED,
  ];

  private static readonly OFFICIALITY_FILTER = [
    BusinessProcessOfficialStatus.OFFICIAL,
    BusinessProcessOfficialStatus.NA,
  ];

  private static readonly QUALITY_LEVEL_FILTER = ["MQG"];

  constructor(
    private readonly fetcherService: ValidationProcessExecutionFetcherService
  ) {}

  fetchData(
    params: RtpCommitIdDataParams,
    pageIndex?: number,
    pageSize?: number,
    searchKey?: string
  ): Observable<PageResponse<string>> {
    return this.fetcherService
      .getValidationProcessExecutions(params.projectId, {
        page: pageIndex ?? 0,
        pageSize: pageSize ?? 100,
        parentBranch: params.parentBranch,
        officiality: RtpCommitIdDataProvider.OFFICIALITY_FILTER,
        businessProcessQualityLevel:
          RtpCommitIdDataProvider.QUALITY_LEVEL_FILTER,
        statuses: RtpCommitIdDataProvider.TERMINAL_STATUSES,
        rtpCommitPhrase: searchKey || undefined,
      })
      .pipe(
        map((response) => ({
          content: [
            ...new Set(
              response.executions
                .map((execution) => execution.input.rtpCommitId)
                .filter((commitId) => !!commitId)
            ),
          ],
          last: response.last,
        }))
      );
  }

  toDropdownOption(commitId: string): DropdownOption<string> {
    return { label: commitId, value: commitId };
  }

  getItemId(commitId: string): string {
    return commitId;
  }
}
