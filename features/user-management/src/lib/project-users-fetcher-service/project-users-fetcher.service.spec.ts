import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { ProjectUsersFetcherService } from "./project-users-fetcher.service";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, throwError } from "rxjs";
import { v4 as uuid } from "uuid";

const GATEWAY_URL = uuid();
describe("Project users fetcher by mail service", () => {
  let service: ProjectUsersFetcherService;
  let httpClient: HttpClient;
  let appConfig: AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
    } as unknown as HttpClient;
    appConfig = {
      gatewayUrl: GATEWAY_URL,
    } as AppConfig;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectUsersFetcherService,
          useClass: ProjectUsersFetcherService,
        },
        {
          provide: HttpClient,
          useValue: httpClient,
        },
        {
          provide: APP_CONFIG,
          useValue: appConfig,
        },
      ],
    });
    service = TestBed.inject(ProjectUsersFetcherService);
  });

  it("should fetch users by mail in a given project", async () => {
    jest.spyOn(httpClient, "get").mockReturnValue(of(getUserPageResponse()));
    const projectId = "projectId1";
    const emails = ["mail1", "mail2"];

    const users = await firstValueFrom(
      service.fetchUsersByEmails(projectId, emails)
    );

    expect(users.content.length).toBe(2);
    expect(users.content[0].id).toBe("userId1");
    expect(users.content[1].id).toBe("userId2");
    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}user-management/projects/${projectId}/users`,
      expect.objectContaining({
        params: expect.objectContaining({
          userEmails: emails,
        }),
      })
    );
  });

  it("should throw an error when a failure occurs while fetching users by emails", async () => {
    const message = "errorMessage";
    jest
      .spyOn(httpClient, "get")
      .mockImplementation(() =>
        throwError(() => ({ status: 500, error: message }))
      );
    const projectId = "projectId1";
    const emails = ["mail1", "mail2"];
    await expect(
      firstValueFrom(service.fetchUsersByEmails(projectId, emails))
    ).rejects.toMatchObject({ message });
  });

  function getUserPageResponse() {
    return {
      content: [
        {
          id: "userId1",
          mail: "mail1",
          displayName: "name1",
        },
        {
          id: "userId2",
          mail: "mail2",
          displayName: "name2",
        },
      ],
    };
  }
});
