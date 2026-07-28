import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  DropdownOption,
  MxEvolveDropdownDataProvider,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  GroupFilterRequest,
  InfraGroupService,
  SelectedGroup,
} from "@mxevolve/domains/infra/data-access";

/**
 * Data provider for the groups single-select dropdown with backend pagination.
 * Originally copied verbatim from the legacy
 * `web/libs/features/infra-management/src/lib/group-dropdown-selection/data-provider/groups-data-provider.ts`,
 * then relocated beside its only consumer (`GroupDropdownSelectionComponent`)
 * and repointed at the consolidated `InfraGroupService` (VAL-27132 follow-up
 * cleanup).
 */
export class GroupsDataProvider
  implements MxEvolveDropdownDataProvider<SelectedGroup, { projectId: string }>
{
  constructor(private readonly groupService: InfraGroupService) {}

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
