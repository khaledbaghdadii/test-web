import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  BipVersion,
  FactoryProduct,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";

export interface BipVersionDataProviderParams {
  readonly projectId: string;
  readonly softwareProductVersion: string;
  readonly softwareProductBuildId: string;
  readonly isCustomBuild: boolean;
  readonly onFactoryProductsFetched: (
    factoryProducts: FactoryProduct[],
    isLastPage: boolean
  ) => void;
}

export class BipVersionDataProvider
  implements
    MxEvolveDropdownDataProvider<BipVersion, BipVersionDataProviderParams>
{
  constructor(
    private readonly factoryProductApiService: FactoryProductApiService
  ) {}

  fetchData(
    params: BipVersionDataProviderParams,
    pageIndex: number,
    pageSize: number,
    searchKey: string
  ): Observable<PageResponse<BipVersion>> {
    if (!params.softwareProductVersion || !params.softwareProductBuildId) {
      return of({ content: [], last: true });
    }

    return this.factoryProductApiService
      .getFactoryProducts(params.projectId, {
        softwareProductVersionFilter: params.softwareProductVersion,
        softwareProductBuildFilter: params.softwareProductBuildId,
        configurationComponentVersionSearch: searchKey || undefined,
        fetchGlobal: !params.isCustomBuild,
        pageIndex,
        pageSize,
      })
      .pipe(
        map((factoryProducts) => {
          params.onFactoryProductsFetched(
            factoryProducts.content,
            factoryProducts.last
          );

          const seen = new Set<string>();
          const bipVersions: BipVersion[] = [];

          for (const factoryProduct of factoryProducts.content) {
            for (const configComponent of factoryProduct.configurationComponents ??
              []) {
              if (
                !configComponent.purged &&
                !seen.has(configComponent.version)
              ) {
                seen.add(configComponent.version);
                bipVersions.push({ version: configComponent.version });
              }
            }
          }

          return {
            content: bipVersions,
            last: factoryProducts.last,
          };
        })
      );
  }

  toDropdownOption(item: BipVersion): DropdownOption<BipVersion> {
    return {
      label: item.version,
      value: item,
    };
  }

  getItemId(item: BipVersion): string {
    return item.version;
  }
}
