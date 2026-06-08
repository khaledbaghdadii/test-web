import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SelectedGroup } from "../../infra-groups/model/selected-group";
import { InfraGroupsService } from "../../infra-groups/infra-groups.service";
import { GroupFilterRequest } from "../../infra-groups/request/group";
import {
  DropdownOption,
  MxEvolveDropdownDataProvider,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";

/**
 * Data provider for groups multiselect dropdown
 * Implements the generic dropdown data provider interface
 */
export class GroupsDataProvider
  implements MxEvolveDropdownDataProvider<SelectedGroup, { projectId: string }>
{
  constructor(private readonly groupsService: InfraGroupsService) {}

  fetchData(
    params: { projectId: string },
    pageIndex: number,
    pageSize: number,
    searchKey: string
  ): Observable<PageResponse<SelectedGroup>> {
    const req: GroupFilterRequest = { searchKey: searchKey };

    return this.groupsService
      .searchGroups(params.projectId, pageSize, pageIndex, req)
      .pipe(
        map((groupsPage) => ({
          content: groupsPage?.content?.map((group) => ({
            id: group.id,
            projectId: group.projectId,
            name: group.name,
          })),
          last: groupsPage.last,
        }))
      );
  }

  toDropdownOption(group: SelectedGroup): DropdownOption<SelectedGroup> {
    return {
      label: group.name,
      value: group,
    };
  }

  getItemId(group: SelectedGroup): string {
    return group.id;
  }
}
