import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { InfraGroupService } from "./infra-group.service";
import {
  DefaultGroup,
  Group,
  GroupFilterRequest,
  Groups,
  ProjectInfraRegistryApiResponse,
} from "./infra-group.model";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_INFRA_GROUP: Group = {
  id: "group-1",
  name: "production-group",
  projectId: "project-1",
};

describe("InfraGroupService", () => {
  let service: InfraGroupService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InfraGroupService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(InfraGroupService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch infra group details", async () => {
    const result = firstValueFrom(service.getGroup("project-1", "group-1"));

    const req = httpController.expectOne(
      `${GATEWAY_URL}projects/project-1/infra/registry/groups/group-1`
    );
    expect(req.request.method).toBe("GET");
    req.flush(MOCK_INFRA_GROUP);

    expect(await result).toEqual(MOCK_INFRA_GROUP);
  });

  it("should map server error message", async () => {
    const result = firstValueFrom(
      service.getGroup("project-1", "group-1")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}projects/project-1/infra/registry/groups/group-1`
      )
      .flush(
        { message: "Group not found" },
        { status: 404, statusText: "Not Found" }
      );

    const error = await result;
    expect(error).toBe("Group not found");
  });

  it("should use a fallback error message when the server provides none", async () => {
    const result = firstValueFrom(
      service.getGroup("project-1", "group-1")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}projects/project-1/infra/registry/groups/group-1`
      )
      .flush(
        { message: null },
        { status: 500, statusText: "Internal Server Error" }
      );

    const error = await result;
    expect(error).toBe("Could not fetch groups details");
  });

  it("should fetch paginated groups", async () => {
    const mockGroups: Groups = {
      content: [MOCK_INFRA_GROUP],
      totalPages: 1,
      totalElements: 1,
      size: 20,
      number: 0,
      last: true,
    };

    const result = firstValueFrom(service.getGroups("project-1", 20, 0));

    const req = httpController.expectOne(
      `${GATEWAY_URL}projects/project-1/infra/registry/groups?page=0&size=20`
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockGroups);

    expect(await result).toEqual(mockGroups);
  });

  it("should filter/search groups", async () => {
    const request: GroupFilterRequest = {
      searchKey: "build",
      groupIds: ["group-1"],
    };
    const mockGroups: Groups = {
      content: [MOCK_INFRA_GROUP],
      totalPages: 1,
      totalElements: 1,
      size: 20,
      number: 0,
      last: true,
    };

    const result = firstValueFrom(
      service.searchGroups("project-1", 20, 0, request)
    );

    const req = httpController.expectOne(
      `${GATEWAY_URL}projects/project-1/infra/registry/groups/filter?page=0&size=20&sort=name`
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(request);
    req.flush(mockGroups);

    expect(await result).toEqual(mockGroups);
  });

  it("should get the project infra registry configuration", async () => {
    const apiResponse: ProjectInfraRegistryApiResponse = {
      createdOn: "2023-10-16T09:51:30.250606Z",
      lastModifiedOn: "2023-10-17T15:06:43.013324Z",
      createdBy: "mxflow-dev-admin",
      lastModifiedBy: "mxflow-dev-admin",
      projectId: "project-1",
      defaultInfraPlugin: "murex",
      defaultAllocationRetryDelay: 60,
      defaultGroup: {
        id: "group-1",
        name: "production-group",
        projectId: "project-1",
      },
    };
    const expected: DefaultGroup = {
      id: "group-1",
      name: "production-group",
      projectId: "project-1",
    };

    const result = firstValueFrom(
      service.getProjectInfraRegistryConfig("project-1")
    );

    const req = httpController.expectOne(
      `${GATEWAY_URL}projects/project-1/infra/registry/config`
    );
    expect(req.request.method).toBe("GET");
    req.flush(apiResponse);

    expect(await result).toEqual(expected);
  });
});
