import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  DropdownOption,
  MxEvolveSingleSelectDataProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import { ValidationProcessListingService } from "@mxevolve/domains/business-process/data-access";

export interface ScopeStartCommitParams {
  projectId: string;
  parentBranch?: string;
}

/**
 * Suggested-commit source for the validation scope-start-commit picker. Mirrors
 * the legacy `RtpCommitIdDataProvider`: fetches the project's MQG validation
 * executions on the parent branch and exposes their distinct RTP commit ids as
 * dropdown options.
 */
export class ScopeStartCommitDataProvider
  implements MxEvolveSingleSelectDataProvider<string, ScopeStartCommitParams>
{
  constructor(
    private readonly listingService: ValidationProcessListingService
  ) {}

  fetchData(params: ScopeStartCommitParams): Observable<string[]> {
    return this.listingService
      .getValidationProcessExecutions(params.projectId, {
        page: 0,
        pageSize: 100,
        parentBranch: params.parentBranch,
        officiality: ["OFFICIAL", "NA"],
        businessProcessQualityLevel: ["MQG"],
        statuses: ["PASSED", "FAILED", "ABORTED"],
      })
      .pipe(
        map((response) => [
          ...new Set(
            response.executions
              .map((execution) => execution.input.rtpCommitId)
              .filter((commitId): commitId is string => Boolean(commitId))
          ),
        ])
      );
  }

  toDropdownOption(item: string): DropdownOption<string> {
    return { label: item, value: item };
  }

  getItemId(item: string): string {
    return item;
  }
}
