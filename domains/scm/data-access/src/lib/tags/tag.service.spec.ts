import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { firstValueFrom } from "rxjs";
import { TagService } from "./tag.service";

const GATEWAY_URL = "https://api.test.com/";
const TAG_URL = `${GATEWAY_URL}scm-operations/projects/project-1/repositories/repo-1/tags/v1.0`;
const ERROR_CASES = [
  { httpStatus: 400, bodyStatus: 404, message: "Tag not found" },
  { httpStatus: 500, bodyStatus: 500, message: "Internal Server Error" },
];

describe("TagService", () => {
  let service: TagService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TagService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(TagService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should resolve a tag to its commit id", async () => {
    const result = firstValueFrom(
      service.getTag("project-1", "repo-1", "v1.0")
    );

    const req = httpController.expectOne(TAG_URL);
    expect(req.request.method).toBe("GET");
    req.flush({ name: "v1.0", commitId: "abc123" });

    expect(await result).toEqual({ name: "v1.0", commitId: "abc123" });
  });

  it.each(ERROR_CASES)(
    "should map response body error message and status",
    async ({ httpStatus, bodyStatus, message }) => {
      const result = firstValueFrom(
        service.getTag("project-1", "repo-1", "v1.0")
      ).catch((e) => e);

      httpController.expectOne(TAG_URL).flush(
        {
          status: bodyStatus,
          message,
        },
        { status: httpStatus, statusText: `HTTP ${httpStatus}` }
      );

      const error = await result;
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(bodyStatus);
      expect(error.message).toBe(message);
    }
  );
});
