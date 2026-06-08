import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { InfraGroupsService } from "../../infra-groups/infra-groups.service";
import { SelectedGroup } from "../../infra-groups/model/selected-group";
import { GroupFilterRequest } from "../../infra-groups/request/group";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";

/**
 * Data provider for groups single-select dropdown with backend pagination.
 * Implements the generic dropdown data provider interface.
 */
export class GroupsDataProvider
  implements MxEvolveDropdownDataProvider<SelectedGroup, { projectId: string }>
{
  constructor(private readonly groupService: InfraGroupsService) {}

  fetchData(
    params: { projectId: string },
    pageIndex: number,
    pageSize: number,
    searchKey: string
  ): Observable<PageResponse<SelectedGroup>> {
    const req: GroupFilterRequest = {
      searchKey: searchKey,
    };

    return this.groupService
      .searchGroups(params.projectId, pageSize, pageIndex, req)
      .pipe(
        map((groupsPage) => ({
          content: groupsPage.content.map((group) => ({
            id: group.id,
            name: group.name,
            projectId: group.projectId,
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
