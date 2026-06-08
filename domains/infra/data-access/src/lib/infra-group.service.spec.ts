import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { InfraGroup, InfraGroupService } from "./infra-group.service";

const GATEWAY_URL = "https://api.test.com/";

const MOCK_INFRA_GROUP: InfraGroup = {
  id: "group-1",
  name: "production-group",
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
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Group not found");
  });

  it("should use http error message as fallback when server provides no body", async () => {
    const result = firstValueFrom(
      service.getGroup("project-1", "group-1")
    ).catch((e) => e);

    httpController
      .expectOne(
        `${GATEWAY_URL}projects/project-1/infra/registry/groups/group-1`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Internal Server Error");
  });
});
