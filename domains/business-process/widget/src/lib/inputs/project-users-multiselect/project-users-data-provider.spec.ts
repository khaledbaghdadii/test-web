import { lastValueFrom, of } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import {
  ProjectUsersService,
  User,
  UsersPageResponse,
} from "@mxevolve/domains/business-process/data-access";
import { ProjectUsersDataProvider } from "./project-users-data-provider";

describe("ProjectUsersDataProvider", () => {
  const projectId = uuidv4();
  let projectUsersService: Pick<ProjectUsersService, "getProjectUsers">;
  let provider: ProjectUsersDataProvider;

  beforeEach(() => {
    projectUsersService = {
      getProjectUsers: jest.fn(() => of(getUsersPage())),
    };
    provider = new ProjectUsersDataProvider(
      projectUsersService as ProjectUsersService
    );
  });

  it("fetches project users with the project id, paging and search key", async () => {
    await lastValueFrom(provider.fetchData({ projectId }, 3, 25, "bob"));

    expect(projectUsersService.getProjectUsers).toHaveBeenCalledWith({
      projectId,
      pageIndex: 3,
      pageSize: 25,
      searchKey: "bob",
    });
  });

  it("returns the page of users from the service", async () => {
    const page = await lastValueFrom(
      provider.fetchData({ projectId }, 0, 10, "")
    );

    expect(page).toEqual(getUsersPage());
  });

  it("converts a user to a dropdown option labelled by display name", () => {
    const user: User = {
      id: "user-1",
      displayName: "Alice",
      mail: "alice@x.com",
    };

    expect(provider.toDropdownOption(user)).toEqual({
      label: "Alice",
      value: user,
    });
  });

  it("uses the user id as the item id", () => {
    const user: User = {
      id: "user-1",
      displayName: "Alice",
      mail: "alice@x.com",
    };

    expect(provider.getItemId(user)).toBe("user-1");
  });

  function getUsersPage(): UsersPageResponse {
    return {
      content: [
        { id: "user-1", displayName: "Alice", mail: "alice@x.com" },
        { id: "user-2", displayName: "Bob", mail: "bob@x.com" },
      ],
      last: true,
    };
  }
});
