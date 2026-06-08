import { Observable } from "rxjs";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  FactoryProductApiService,
  SoftwareProductVersion,
} from "@mxevolve/domains/artifact/data-access";

export class MxVersionDataProvider
  implements
    MxEvolveDropdownDataProvider<SoftwareProductVersion, { projectId: string }>
{
  constructor(
    private readonly factoryProductApiService: FactoryProductApiService
  ) {}

  fetchData(
    params: { projectId: string },
    pageIndex: number,
    pageSize: number,
    searchKey?: string
  ): Observable<PageResponse<SoftwareProductVersion>> {
    return this.factoryProductApiService.getDistinctVersions(
      params.projectId,
      pageIndex,
      pageSize,
      searchKey
    );
  }

  toDropdownOption(
    item: SoftwareProductVersion
  ): DropdownOption<SoftwareProductVersion> {
    return {
      label: item.version,
      value: item,
    };
  }

  getItemId(item: SoftwareProductVersion): string {
    return item.version;
  }
}
