import { Observable, of } from "rxjs";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  SoftwareProductBuild,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";

export interface MxBuildIdDataProviderParams {
  readonly projectId: string;
  readonly softwareProductVersion: string;
}

export class MxBuildIdDataProvider
  implements
    MxEvolveDropdownDataProvider<
      SoftwareProductBuild,
      MxBuildIdDataProviderParams
    >
{
  private static readonly CUSTOM_PREFIX = "CUSTOM-";

  constructor(
    private readonly factoryProductApiService: FactoryProductApiService
  ) {}

  fetchData(
    params: MxBuildIdDataProviderParams,
    pageIndex: number,
    pageSize: number,
    searchKey?: string
  ): Observable<PageResponse<SoftwareProductBuild>> {
    if (!params.softwareProductVersion) {
      return of({ content: [], last: true });
    }

    return this.factoryProductApiService.getDistinctBuilds(
      params.projectId,
      params.softwareProductVersion,
      pageIndex,
      pageSize,
      searchKey
    );
  }

  toDropdownOption(
    item: SoftwareProductBuild
  ): DropdownOption<SoftwareProductBuild> {
    return {
      label: item.projectId
        ? `${MxBuildIdDataProvider.CUSTOM_PREFIX}${item.buildId}`
        : item.buildId,
      value: item,
    };
  }

  getItemId(item: SoftwareProductBuild): string {
    return `${item.buildId}_${item.projectId ?? "global"}`;
  }
}
