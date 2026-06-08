import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import {
  MergeConfigurationService,
  MergeConfigurationPage,
} from "./merge-configuration.service";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_PAGE: MergeConfigurationPage = {
  content: [
    {
      id: "mc-1",
      projectId: "project-1",
      branchName: "main",
      mergeConfigurationDefinition: {
        id: "mcd-1",
        repositoryId: "repo-1",
        branchPattern: "main",
      },
    },
  ],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  last: true,
};

describe("MergeConfigurationService", () => {
  let service: MergeConfigurationService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MergeConfigurationService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(MergeConfigurationService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch filtered merge configurations", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeConfigurations(
        "project-1",
        "repo-1",
        "main",
        0,
        20
      )
    );

    const req = httpController.expectOne(
      `${GATEWAY_URL}scm-management/projects/project-1/settings/merge-configurations/filter?page=0&size=20`
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      searchKey: "main",
      repositoryId: "repo-1",
    });
    req.flush(MOCK_PAGE);

    expect(await result).toEqual(MOCK_PAGE);
  });

  it("should map server error message", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeConfigurations("project-1", "repo-1", "", 0, 20)
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/settings/merge-configurations/filter?page=0&size=20`
      )
      .flush(
        { message: "Not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Not found");
  });

  it("should use fallback error message when server provides none", async () => {
    const result = firstValueFrom(
      service.getFilteredMergeConfigurations("project-1", "repo-1", "", 0, 20)
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}scm-management/projects/project-1/settings/merge-configurations/filter?page=0&size=20`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });
});
