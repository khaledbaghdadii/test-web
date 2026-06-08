import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  MergeConfiguration,
  MergeConfigurationService,
} from "@mxevolve/domains/scm/data-access";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";

export class MergeConfigurationDataProvider
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
    return this.mergeConfigurationService
      .getFilteredMergeConfigurations(
        params.projectId,
        params.repositoryId,
        searchKey,
        pageIndex,
        pageSize
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
