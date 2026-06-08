import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ArtifactDumpsService, Dump } from "@mxflow/features/artifact-manager";
import {
  DropdownOption,
  MxEvolveDropdownDataProvider,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";

export class DumpsDataProvider implements MxEvolveDropdownDataProvider<Dump> {
  constructor(private readonly dumpsService: ArtifactDumpsService) {}

  fetchData(
    _params: unknown,
    pageIndex: number,
    pageSize: number,
    searchKey: string
  ): Observable<PageResponse<Dump>> {
    return this.dumpsService
      .getAllDumps({
        pageIndex: pageIndex ?? 0,
        pageSize: pageSize ?? 10,
        searchKey: searchKey ?? "",
      })
      .pipe(
        map((dumpsPage) => ({
          content: dumpsPage.content,
          last: dumpsPage.last,
        }))
      );
  }

  toDropdownOption(dump: Dump): DropdownOption<Dump> {
    return {
      label: dump.id,
      value: dump,
    };
  }

  getItemId(dump: Dump): string {
    return dump.id;
  }
}
