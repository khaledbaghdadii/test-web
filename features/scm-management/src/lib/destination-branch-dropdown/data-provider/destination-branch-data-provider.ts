import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MergeConfigurationService } from "../../merge-configuration/merge-configuration.service";
import { MergeConfiguration } from "../../merge-configuration/model/merge-configuration";
import { MergeConfigurationFilterRequest } from "../../merge-configuration/model/request/merge-configuration-filter-request";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";

/**
 * Data provider for destination branch single-select dropdown with backend pagination.
 * Fetches merge configurations filtered by repository.
 */
export class DestinationBranchDataProvider
  implements
    MxEvolveDropdownDataProvider<
      MergeConfiguration,
      { projectId: string; repositoryId: string }
    >
{
  constructor(
    private readonly mergeConfigurationService: MergeConfigurationService
  ) {}

  fetchData(
    params: { projectId: string; repositoryId: string },
    pageIndex: number,
    pageSize: number,
    searchKey: string
  ): Observable<PageResponse<MergeConfiguration>> {
    const filterRequest: MergeConfigurationFilterRequest = {
      searchKey: searchKey,
      repositoryId: params.repositoryId,
    };

    return this.mergeConfigurationService
      .getFilteredMergeConfigurations(
        params.projectId,
        filterRequest,
        pageSize,
        pageIndex
      )
      .pipe(
        map((page) => ({
          content: page.content,
          last: page.last,
        }))
      );
  }

  toDropdownOption(
    item: MergeConfiguration
  ): DropdownOption<MergeConfiguration> {
    return {
      label: item.branchName,
      value: item,
      tooltip: item.mergeConfigurationDefinition?.branchPattern,
    };
  }

  getItemId(item: MergeConfiguration): string {
    return item.id;
  }
}
