import {
  DropdownOption,
  MxEvolveDropdownDataProvider,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import { map, Observable } from "rxjs";
import { Version } from "@mxevolve/domains/test/model";
import {
  FetchVersionsQuery,
  VersionService,
} from "@mxevolve/domains/test/data-access";
import { inject, Injectable } from "@angular/core";
import { VersionsDropdownParams } from "./versions-dropdown-params";

@Injectable()
export class VersionsDataProvider
  implements MxEvolveDropdownDataProvider<Version, VersionsDropdownParams>
{
  private readonly versionService = inject(VersionService);

  fetchData(
    params: VersionsDropdownParams,
    pageIndex?: number,
    pageSize?: number,
    searchKey?: string
  ): Observable<PageResponse<Version>> {
    const trimmedSearchKey = searchKey?.trim();
    const query: FetchVersionsQuery = {
      page: pageIndex ?? 0,
      size: pageSize ?? 20,
      versionTypes: params.versionTypes,
      ...(params.active !== undefined ? { active: params.active } : {}),
      ...(trimmedSearchKey ? { namePhrase: trimmedSearchKey } : {}),
    };

    return this.versionService.fetchVersions(query).pipe(
      map((page) => ({
        content: page.content.map((v) => ({ id: v.id, name: v.name })),
        last: page.last,
      }))
    );
  }

  getItemId(item: Version): string | number {
    return item.id;
  }

  toDropdownOption(item: Version): DropdownOption<Version> {
    return {
      label: item.name,
      value: item,
    };
  }
}
