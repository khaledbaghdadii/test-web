import { Observable } from "rxjs";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ProjectUsersService,
  User,
} from "@mxevolve/domains/business-process/data-access";

/**
 * Data provider for the project-users dropdown.
 * Originally copied verbatim from the legacy
 * `project-users-multiselect/data-provider/project-users-data-provider.ts`,
 * then relocated beside its only consumer (`ProjectUsersMultiselectComponent`)
 * instead of living in `data-access` (VAL-27132 follow-up cleanup).
 */
export class ProjectUsersDataProvider
  implements MxEvolveDropdownDataProvider<User, { projectId: string }>
{
  constructor(private readonly projectUsersService: ProjectUsersService) {}

  fetchData(
    params: { projectId: string },
    pageIndex: number,
    pageSize: number,
    searchKey: string
  ): Observable<PageResponse<User>> {
    return this.projectUsersService.getProjectUsers({
      projectId: params.projectId,
      pageIndex,
      pageSize,
      searchKey,
    });
  }

  toDropdownOption(user: User): DropdownOption<User> {
    return {
      label: user.displayName,
      value: user,
    };
  }

  getItemId(user: User): string {
    return user.id;
  }
}
