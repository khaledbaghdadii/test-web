import { GroupsDataProvider } from "./groups-data-provider";
import { InfraGroupsService } from "../../infra-groups/infra-groups.service";
import { of, lastValueFrom } from "rxjs";
import { GroupsAPIResponse } from "../../infra-groups/response/groups-api-response";

describe("GroupsDataProvider", () => {
  let dataProvider: GroupsDataProvider;
  let mockGroupService: jest.Mocked<InfraGroupsService>;

  const MOCK_GROUPS_RESPONSE: GroupsAPIResponse = {
    content: [
      {
        id: "group1",
        projectId: "projectId",
        name: "Group 1",
        defaultSshCredentials: { uri: "", isInherited: false },
        defaultMssqlDbCredentials: { uri: "", isInherited: false },
        defaultOracleDbCredentials: { uri: "", isInherited: false },
        defaultPostgresDbCredentials: { uri: "", isInherited: false },
        defaultSybaseDbCredentials: { uri: "", isInherited: false },
      },
      {
        id: "group2",
        projectId: "projectId",
        name: "Group 2",
        defaultSshCredentials: { uri: "", isInherited: false },
        defaultMssqlDbCredentials: { uri: "", isInherited: false },
        defaultOracleDbCredentials: { uri: "", isInherited: false },
        defaultPostgresDbCredentials: { uri: "", isInherited: false },
        defaultSybaseDbCredentials: { uri: "", isInherited: false },
      },
    ],
    totalPages: 1,
    totalElements: 2,
    size: 10,
    number: 0,
    last: true,
  };

  beforeEach(() => {
    mockGroupService = {
      searchGroups: jest.fn().mockReturnValue(of(MOCK_GROUPS_RESPONSE)),
    } as unknown as jest.Mocked<InfraGroupsService>;

    dataProvider = new GroupsDataProvider(mockGroupService);
  });

  describe("fetchData", () => {
    it("should fetch groups and map to PageResponse", () => {
      return lastValueFrom(
        dataProvider.fetchData({ projectId: "projectId" }, 0, 10, "")
      ).then((result) => {
        expect(mockGroupService.searchGroups).toHaveBeenCalledWith(
          "projectId",
          10,
          0,
          { searchKey: "" }
        );
        expect(result.content).toEqual([
          { id: "group1", name: "Group 1", projectId: "projectId" },
          { id: "group2", name: "Group 2", projectId: "projectId" },
        ]);
        expect(result.last).toBe(true);
      });
    });

    it("should pass search key to service", () => {
      return lastValueFrom(
        dataProvider.fetchData({ projectId: "projectId" }, 0, 10, "searchTerm")
      ).then(() => {
        expect(mockGroupService.searchGroups).toHaveBeenCalledWith(
          "projectId",
          10,
          0,
          { searchKey: "searchTerm" }
        );
      });
    });
  });

  describe("toDropdownOption", () => {
    it("should map group to dropdown option", () => {
      const group = { id: "group1", name: "Group 1", projectId: "projectId" };

      const option = dataProvider.toDropdownOption(group);

      expect(option).toEqual({
        label: "Group 1",
        value: group,
      });
    });
  });

  describe("getItemId", () => {
    it("should return the group id", () => {
      const group = { id: "group1", name: "Group 1", projectId: "projectId" };

      expect(dataProvider.getItemId(group)).toBe("group1");
    });
  });
});
