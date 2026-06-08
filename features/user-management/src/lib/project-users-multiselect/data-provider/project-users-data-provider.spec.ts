import { ProjectUsersDataProvider } from "./project-users-data-provider";
import { ProjectUsersService } from "../service/project-users.service";
import { User } from "@mxflow/features/user";
import { of, firstValueFrom } from "rxjs";

describe("ProjectUsersDataProvider", () => {
  let provider: ProjectUsersDataProvider;
  let mockProjectUsersService: jest.Mocked<ProjectUsersService>;

  const MOCK_USER: User = {
    id: "user-1",
    displayName: "John Doe",
    mail: "john.doe@example.com",
  };

  const MOCK_USERS_PAGE = {
    content: [MOCK_USER],
    last: false,
  };

  beforeEach(() => {
    mockProjectUsersService = {
      getProjectUsers: jest.fn().mockReturnValue(of(MOCK_USERS_PAGE)),
    } as unknown as jest.Mocked<ProjectUsersService>;

    provider = new ProjectUsersDataProvider(mockProjectUsersService);
  });

  describe("fetchData", () => {
    it("should fetch users with correct parameters", async () => {
      const params = { projectId: "project-123" };
      const pageIndex = 1;
      const pageSize = 20;
      const searchKey = "john";

      const response = await firstValueFrom(
        provider.fetchData(params, pageIndex, pageSize, searchKey)
      );

      expect(mockProjectUsersService.getProjectUsers).toHaveBeenCalledWith({
        projectId: "project-123",
        pageIndex: 1,
        pageSize: 20,
        searchKey: "john",
      });
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toEqual(MOCK_USER);
      expect(response.last).toBe(false);
    });

    it("should return paginated response correctly", async () => {
      const multipleUsersPage = {
        content: [
          { id: "user-1", displayName: "John Doe", mail: "john@example.com" },
          { id: "user-2", displayName: "Jane Smith", mail: "jane@example.com" },
          { id: "user-3", displayName: "Bob Johnson", mail: "bob@example.com" },
        ],
        last: true,
      };
      mockProjectUsersService.getProjectUsers.mockReturnValue(
        of(multipleUsersPage)
      );

      const params = { projectId: "project-789" };
      const response = await firstValueFrom(
        provider.fetchData(params, 2, 15, "test")
      );

      expect(response.content).toHaveLength(3);
      expect(response.last).toBe(true);
    });
  });

  describe("toDropdownOption", () => {
    it("should convert user to dropdown option with displayName as label", () => {
      const option = provider.toDropdownOption(MOCK_USER);

      expect(option).toEqual({
        label: "John Doe",
        value: MOCK_USER,
      });
    });
  });

  describe("getItemId", () => {
    it("should return user id", () => {
      const id = provider.getItemId(MOCK_USER);

      expect(id).toBe("user-1");
    });
  });
});
