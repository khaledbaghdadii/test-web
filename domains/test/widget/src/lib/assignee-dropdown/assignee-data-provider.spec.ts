import { firstValueFrom, of } from "rxjs";
import {
  AssigneeDataParams,
  AssigneeDataProvider,
} from "./assignee-data-provider";
import { User, Users, UserService } from "@mxflow/features/user";

describe("AssigneeDataProvider", () => {
  let provider: AssigneeDataProvider;
  let userService: jest.Mocked<UserService>;

  const params: AssigneeDataParams = {
    projectId: "project-1",
    bpcIds: ["bpc-1", "bpc-2"],
  };

  const users: User[] = [
    {
      id: "user-1",
      displayName: "John Doe",
      mail: "john.doe@test.com",
    } as User,
    {
      id: "user-2",
      displayName: "Jane Smith",
      mail: "jane.smith@test.com",
    } as User,
  ];

  const userResponse: Users = {
    users,
    lastPage: true,
  } as Users;

  beforeEach(() => {
    userService = {
      getUsersByBpcIds: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    provider = new AssigneeDataProvider(userService);
  });

  it("should request users using provided filters, pagination and search key", async () => {
    userService.getUsersByBpcIds.mockReturnValue(of(userResponse));

    await firstValueFrom(provider.fetchData(params, 2, 25, "john"));

    expect(userService.getUsersByBpcIds).toHaveBeenCalledWith(
      ["bpc-1", "bpc-2"],
      "project-1",
      25,
      2,
      "john"
    );
  });

  it("should use default pagination and empty search key when optional arguments are not provided", async () => {
    userService.getUsersByBpcIds.mockReturnValue(of(userResponse));

    await firstValueFrom(provider.fetchData(params));

    expect(userService.getUsersByBpcIds).toHaveBeenCalledWith(
      ["bpc-1", "bpc-2"],
      "project-1",
      50,
      0,
      ""
    );
  });

  it("should map returned users into page response content", async () => {
    userService.getUsersByBpcIds.mockReturnValue(of(userResponse));

    const result = await firstValueFrom(provider.fetchData(params));

    expect(result.content).toEqual(users);
  });

  it("should map lastPage into page response last flag", async () => {
    userService.getUsersByBpcIds.mockReturnValue(
      of({
        users,
        lastPage: false,
      } as Users)
    );

    const result = await firstValueFrom(provider.fetchData(params));

    expect(result.last).toBe(false);
  });

  it("should convert a user into a dropdown option", () => {
    const result = provider.toDropdownOption(users[0]);

    expect(result).toEqual({
      label: "John Doe",
      value: users[0],
      tooltip: "john.doe@test.com",
    });
  });

  it("should return the user id as item id", () => {
    expect(provider.getItemId(users[0])).toBe("user-1");
  });
});
