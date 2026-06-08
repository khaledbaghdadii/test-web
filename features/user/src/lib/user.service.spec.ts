/* tslint:disable:no-unused-variable */

import { HttpClient, HttpParams } from "@angular/common/http";
import { AppConfig } from "@mxflow/config";
import { lastValueFrom, of, throwError } from "rxjs";
import { UserService } from "./user.service";

describe("Service: User", () => {
  let userService: UserService;
  let httpClient: HttpClient;
  const ERROR_MESSAGE = "error";

  const appConfig: AppConfig = {
    gatewayUrl: "gatewayUrl/",
  } as unknown as AppConfig;

  it("should get User by id", async () => {
    httpClient = {
      get: jest.fn(() => of({ id: "id", mail: "mail", displayName: "name" })),
    } as unknown as HttpClient;

    userService = new UserService(appConfig, httpClient);
    const projectId = "123";
    await expect(
      lastValueFrom(userService.getUserById("1", projectId))
    ).resolves.toEqual({
      id: "id",
      mail: "mail",
      displayName: "name",
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl + "projects/" + projectId + "/users/1"
    );
  });

  it("should throw an error on failure to get user by id", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => ERROR_MESSAGE));
    const projectId = "123";

    userService.getUserById("1", projectId).subscribe({
      error: (error) => {
        expect(error).toEqual(ERROR_MESSAGE);
      },
    });
  });
  it("should get Users by bpc id", async () => {
    httpClient = {
      get: jest.fn(() =>
        of({
          users: [{ id: "id", mail: "mail", displayName: "name" }],
          lastPage: true,
        })
      ),
    } as unknown as HttpClient;

    userService = new UserService(appConfig, httpClient);
    const projectId = "123";
    const size = 200;
    const page = 0;
    const username = "name";
    const params = new HttpParams()
      .set("bpcIds", "bpc1")
      .set("size", size)
      .set("page", page)
      .set("username", username);
    await expect(
      lastValueFrom(
        userService.getUsersByBpcIds(["bpc1"], projectId, size, page, username)
      )
    ).resolves.toEqual({
      users: [{ id: "id", mail: "mail", displayName: "name" }],
      lastPage: true,
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl + "projects/123/users",
      { params: params }
    );
  });

  it("should get the user profile picture", async () => {
    const userImage = "imageAsString";
    const projectId = "projectId";
    const userId = "userId";
    httpClient = {
      get: jest.fn(() =>
        of({
          profilePicture: userImage,
        })
      ),
    } as unknown as HttpClient;
    userService = new UserService(appConfig, httpClient);

    await expect(
      lastValueFrom(userService.getUserProfilePicture())
    ).resolves.toEqual({
      profilePicture: userImage,
    });
    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl + "projects/users/profile-picture"
    );
  });
});
