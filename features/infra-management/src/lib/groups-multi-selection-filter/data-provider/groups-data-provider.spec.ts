import { GroupsDataProvider } from "./groups-data-provider";
import { InfraGroupsService } from "../../infra-groups/infra-groups.service";
import { SelectedGroup } from "../../infra-groups/model/selected-group";
import { firstValueFrom, of } from "rxjs";
import { GroupsAPIResponse } from "@mxflow/features/infra-management";

describe("GroupsDataProvider", () => {
  let provider: GroupsDataProvider;
  let mockGroupsService: jest.Mocked<InfraGroupsService>;

  const MOCK_GROUP: SelectedGroup = {
    id: "group-1",
    projectId: "project-1",
    name: "Test Group",
  };

  const MOCK_GROUPS_PAGE = {
    content: [
      {
        id: "group-1",
        projectId: "project-1",
        name: "Test Group",
      },
    ],
    last: false,
    totalPages: 2,
    totalElements: 15,
    size: 10,
    number: 0,
  };

  beforeEach(() => {
    mockGroupsService = {
      searchGroups: jest.fn().mockReturnValue(of(MOCK_GROUPS_PAGE)),
    } as unknown as jest.Mocked<InfraGroupsService>;

    provider = new GroupsDataProvider(mockGroupsService);
  });

  describe("fetchData", () => {
    const params = { projectId: "project-123" };
    const pageIndex = 1;
    const pageSize = 20;
    const searchKey = "test";
    it("should fetch groups with correct parameters", async () => {
      const response = await firstValueFrom(
        provider.fetchData(params, pageIndex, pageSize, searchKey)
      );

      expect(mockGroupsService.searchGroups).toHaveBeenCalledWith(
        "project-123",
        20,
        1,
        { searchKey: "test" }
      );
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toEqual(MOCK_GROUP);
      expect(response.last).toBe(false);
    });
    it("should handle empty response from service", async () => {
      mockGroupsService.searchGroups.mockReturnValue(
        of({
          totalPages: 0,
          totalElements: 0,
          size: 0,
          last: true,
        } as unknown as GroupsAPIResponse)
      );

      const response = await firstValueFrom(
        provider.fetchData(params, pageIndex, pageSize, searchKey)
      );

      expect(mockGroupsService.searchGroups).toHaveBeenCalledWith(
        "project-123",
        20,
        1,
        { searchKey: "test" }
      );
      expect(response.content).toBeUndefined();
      expect(response.last).toBe(true);
    });
  });

  describe("toDropdownOption", () => {
    it("should convert group to dropdown option with name as label", () => {
      const option = provider.toDropdownOption(MOCK_GROUP);

      expect(option).toEqual({
        label: "Test Group",
        value: MOCK_GROUP,
      });
    });
  });

  describe("getItemId", () => {
    it("should return group id", () => {
      const id = provider.getItemId(MOCK_GROUP);

      expect(id).toBe("group-1");
    });
  });
});
