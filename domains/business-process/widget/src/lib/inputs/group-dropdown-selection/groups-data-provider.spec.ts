import { lastValueFrom, of } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import {
  Groups,
  InfraGroupService,
  SelectedGroup,
} from "@mxevolve/domains/infra/data-access";
import { GroupsDataProvider } from "./groups-data-provider";

describe("GroupsDataProvider", () => {
  const projectId = uuidv4();
  let groupService: Pick<InfraGroupService, "searchGroups">;
  let provider: GroupsDataProvider;

  beforeEach(() => {
    groupService = {
      searchGroups: jest.fn(() => of(getGroupsPage())),
    };
    provider = new GroupsDataProvider(groupService as InfraGroupService);
  });

  it("searches groups with the project id, paging and search key", async () => {
    await lastValueFrom(provider.fetchData({ projectId }, 2, 20, "alpha"));

    expect(groupService.searchGroups).toHaveBeenCalledWith(projectId, 20, 2, {
      searchKey: "alpha",
    });
  });

  it("maps the fetched groups to id, name and project id", async () => {
    const page = await lastValueFrom(
      provider.fetchData({ projectId }, 0, 10, "")
    );

    expect(page).toEqual({
      content: [
        { id: "group-1", name: "Group One", projectId },
        { id: "group-2", name: "Group Two", projectId },
      ],
      last: true,
    });
  });

  it("converts a group to a dropdown option labelled by its name", () => {
    const group: SelectedGroup = {
      id: "group-1",
      name: "Group One",
      projectId,
    };

    expect(provider.toDropdownOption(group)).toEqual({
      label: "Group One",
      value: group,
    });
  });

  it("uses the group id as the item id", () => {
    const group: SelectedGroup = {
      id: "group-1",
      name: "Group One",
      projectId,
    };

    expect(provider.getItemId(group)).toBe("group-1");
  });

  function getGroupsPage(): Groups {
    return {
      content: [
        {
          id: "group-1",
          name: "Group One",
          projectId,
        } as Groups["content"][number],
        {
          id: "group-2",
          name: "Group Two",
          projectId,
        } as Groups["content"][number],
      ],
      totalPages: 1,
      totalElements: 2,
      size: 10,
      number: 0,
      last: true,
    };
  }
});
