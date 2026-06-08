import { GroupService } from "./group.service";
import { Group } from "@mxflow/features/group";
import { APP_CONFIG } from "@mxflow/config";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

const PROJECT_ID = "projectId";
const FIRST_GROUP_DISPLAY_NAME = "MODI";
const FIRST_GROUP_ID = "12345";
const SECOND_GROUP_DISPLAY_NAME = "GROUP2";
const SECOND_GROUP_ID = "123457";
const GATEWAY_URL = "https://example.com/api/";

describe("Service: Group", () => {
  let groupService: GroupService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GroupService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    groupService = TestBed.inject(GroupService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("getAllGroups", () => {
    it("should get all Groups ", async () => {
      const url = GATEWAY_URL + "projects/groups";
      const expectedGroups = getGroups();
      groupService.getAllGroups("").subscribe((actualGroups) => {
        expect(actualGroups).toEqual(expectedGroups);
      });

      const testRequest = httpTestingController.expectOne(url);
      expect(testRequest.request.method).toBe("GET");
      testRequest.flush(getGroups());
    });

    it("should handle error response from server", () => {
      const url = GATEWAY_URL + "projects/" + "groups";
      const errorResponse = { status: 404, message: "Not Found" };
      const emsg = "deliberate 404 error";
      groupService.getAllGroups("").subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });

      const testRequest = httpTestingController.expectOne(url);
      expect(testRequest.request.method).toBe("GET");
      testRequest.flush(emsg, { status: 404, statusText: "Not Found" });
    });

    it("should get Groups starting with a prefix", () => {
      const url = GATEWAY_URL + "projects/" + "groups?prefix=prefix";
      const expectedGroups = getGroups();

      groupService.getAllGroups("prefix").subscribe((actualGroups) => {
        expect(actualGroups).toEqual(expectedGroups);
      });
      const testRequest = httpTestingController.expectOne(url);
      expect(testRequest.request.method).toBe("GET");
      testRequest.flush(getGroups());
    });
  });

  describe("getGroups", () => {
    it("should get Groups starting with a prefix", async () => {
      const url = GATEWAY_URL + "projects/" + PROJECT_ID + "/groups";
      const expectedGroups = getGroups();

      groupService.getGroups(PROJECT_ID).subscribe((actualGroups) => {
        expect(actualGroups).toEqual(expectedGroups);
      });
      const testRequest = httpTestingController.expectOne(url);
      expect(testRequest.request.method).toBe("GET");
      testRequest.flush(getGroups());
    });

    it("should handle error response from server", () => {
      const url = GATEWAY_URL + "projects/" + PROJECT_ID + "/groups";
      const errorResponse = { status: 404, message: "Not Found" };
      const emsg = "deliberate 404 error";
      groupService.getGroups(PROJECT_ID).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
        },
      });

      const testRequest = httpTestingController.expectOne(url);
      expect(testRequest.request.method).toBe("GET");
      testRequest.flush(emsg, { status: 404, statusText: "Not Found" });
    });
  });

  function getGroups(): Group[] {
    return [
      {
        id: FIRST_GROUP_ID,
        displayName: FIRST_GROUP_DISPLAY_NAME,
      },
      {
        id: SECOND_GROUP_ID,
        displayName: SECOND_GROUP_DISPLAY_NAME,
      },
    ];
  }
});
