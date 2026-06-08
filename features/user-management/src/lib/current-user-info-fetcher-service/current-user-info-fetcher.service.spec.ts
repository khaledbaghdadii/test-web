import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { CurrentUserInfoFetcherService } from "./current-user-info-fetcher.service";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, throwError } from "rxjs";
import { v4 as uuid } from "uuid";

const GATEWAY_URL = uuid();
describe("CurrentUserInfoFetcherService", () => {
  let service: CurrentUserInfoFetcherService;
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
          provide: CurrentUserInfoFetcherService,
          useClass: CurrentUserInfoFetcherService,
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
    service = TestBed.inject(CurrentUserInfoFetcherService);
  });

  it("should fetch current user info", async () => {
    const expectedUserInfo = {
      userId: uuid(),
      displayName: uuid(),
      email: uuid(),
      username: uuid(),
      groups: ["group1", "group2"],
    };
    jest.spyOn(httpClient, "get").mockReturnValue(of(expectedUserInfo));

    const userInfo = await firstValueFrom(service.fetchCurrentUserInfo());

    expect(userInfo).toEqual(expectedUserInfo);
    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}user-management/current-user-info`
    );
  });

  it("should throw an error when a failure occurs while fetching current user info", async () => {
    const message = "errorMessage";
    jest
      .spyOn(httpClient, "get")
      .mockImplementation(() =>
        throwError(() => ({ status: 500, error: message }))
      );

    await expect(
      firstValueFrom(service.fetchCurrentUserInfo())
    ).rejects.toMatchObject({ status: 500, error: message });
  });
});
