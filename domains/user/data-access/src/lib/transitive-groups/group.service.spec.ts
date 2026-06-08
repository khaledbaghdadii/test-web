import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { type Group, GroupService, type GroupsPage } from "./group.service";
import { provideHttpClient } from "@angular/common/http";

describe("GroupService", () => {
  let service: GroupService;
  let httpController: HttpTestingController;
  const gatewayUrl = "https://gateway/";
  const baseUrl = `${gatewayUrl}user-management/current-user/transitive-groups`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GroupService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl } },
      ],
    });

    service = TestBed.inject(GroupService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch transitive groups from the correct endpoint", () => {
    const mockResponse: GroupsPage = {
      content: [
        { id: "group-1", name: "Group One" },
        { id: "group-2", name: "Group Two" },
      ],
      last: true,
    };

    service.getTransitiveGroups().subscribe((result: GroupsPage) => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpController.expectOne((r) => r.url === baseUrl);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("page")).toBe("0");
    expect(req.request.params.get("size")).toBe("100");
    req.flush(mockResponse);
  });

  it("should return an empty page when backend returns empty content", () => {
    const mockResponse: GroupsPage = { content: [], last: true };

    service.getTransitiveGroups().subscribe((result: GroupsPage) => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpController.expectOne((r) => r.url === baseUrl);
    req.flush(mockResponse);
  });

  it("should pass custom page and size parameters", () => {
    const mockResponse: GroupsPage = {
      content: [{ id: "group-3", name: "Group Three" }],
      last: false,
    };

    service.getTransitiveGroups(2, 50).subscribe((result: GroupsPage) => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpController.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get("page")).toBe("2");
    expect(req.request.params.get("size")).toBe("50");
    req.flush(mockResponse);
  });

  describe("getAllTransitiveGroups", () => {
    it("should return all groups when response fits in a single page", () => {
      const groups: Group[] = [
        { id: "group-1", name: "Group One" },
        { id: "group-2", name: "Group Two" },
      ];

      service.getAllTransitiveGroups().subscribe((result) => {
        expect(result).toEqual(groups);
      });

      const req = httpController.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get("page")).toBe("0");
      expect(req.request.params.get("size")).toBe("100");
      req.flush({ content: groups, last: true });
    });

    it("should accumulate groups across multiple pages", () => {
      service.getAllTransitiveGroups(2).subscribe((result) => {
        expect(result).toEqual([
          { id: "g1", name: "G1" },
          { id: "g2", name: "G2" },
          { id: "g3", name: "G3" },
        ]);
      });

      const req1 = httpController.expectOne((r) => r.url === baseUrl);
      expect(req1.request.params.get("page")).toBe("0");
      expect(req1.request.params.get("size")).toBe("2");
      req1.flush({
        content: [
          { id: "g1", name: "G1" },
          { id: "g2", name: "G2" },
        ],
        last: false,
      });

      const req2 = httpController.expectOne((r) => r.url === baseUrl);
      expect(req2.request.params.get("page")).toBe("1");
      expect(req2.request.params.get("size")).toBe("2");
      req2.flush({ content: [{ id: "g3", name: "G3" }], last: true });
    });

    it("should return empty array when no groups exist", () => {
      service.getAllTransitiveGroups().subscribe((result) => {
        expect(result).toEqual([]);
      });

      const req = httpController.expectOne((r) => r.url === baseUrl);
      req.flush({ content: [], last: true });
    });
  });
});
