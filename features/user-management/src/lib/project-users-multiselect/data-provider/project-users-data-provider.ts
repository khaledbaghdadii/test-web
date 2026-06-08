import { Observable } from "rxjs";
import { User } from "@mxflow/features/user";
import { ProjectUsersService } from "../service/project-users.service";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";

/**
 * Data provider for project users dropdown
 * Implements the generic dropdown data provider interface
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
