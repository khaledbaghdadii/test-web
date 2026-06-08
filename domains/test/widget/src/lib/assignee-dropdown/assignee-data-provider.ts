import { Observable, map } from "rxjs";
import { User, Users, UserService } from "@mxflow/features/user";
import {
  MxEvolveDropdownDataProvider,
  DropdownOption,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";

export interface AssigneeDataParams {
  projectId: string;
  bpcIds: string[];
}

export class AssigneeDataProvider
  implements MxEvolveDropdownDataProvider<User, AssigneeDataParams>
{
  constructor(private readonly userService: UserService) {}

  fetchData(
    params: AssigneeDataParams,
    pageIndex = 0,
    pageSize = 50,
    searchKey = ""
  ): Observable<PageResponse<User>> {
    return this.userService
      .getUsersByBpcIds(
        params.bpcIds,
        params.projectId,
        pageSize,
        pageIndex,
        searchKey
      )
      .pipe(
        map((response: Users) => ({
          content: response.users,
          last: response.lastPage,
        }))
      );
  }

  toDropdownOption(user: User): DropdownOption<User> {
    return {
      label: user.displayName,
      value: user,
      tooltip: user.mail,
    };
  }

  getItemId(user: User): string {
    return user.id;
  }
}
