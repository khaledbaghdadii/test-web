import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import { AnnouncementBannerService } from "./announcement-banner.service";
import { AnnouncementApiResponse } from "../model/announcement-api-response";
import { UpdateAnnouncementApiRequest } from "../model/update-announcement-api-request";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com/";
const MOCK_API_URL = `${MOCK_GATEWAY_URL}projects/announcements`;
const MOCK_RESPONSE: AnnouncementApiResponse = {
  htmlAnnouncement: "<b>Test Announcement</b>",
  enabled: true,
  showWarning: false,
};

describe("AnnouncementBannerService", () => {
  let service: AnnouncementBannerService;
  let httpMock: HttpTestingController;
  const mockAppConfig = { gatewayUrl: MOCK_GATEWAY_URL };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AnnouncementBannerService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    });
    service = TestBed.inject(AnnouncementBannerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getGlobalAnnouncement", () => {
    it("should call getGlobalAnnouncement and return the announcement response", () => {
      service.getGlobalAnnouncement().subscribe((res) => {
        expect(res).toEqual(MOCK_RESPONSE);
      });
      const req = httpMock.expectOne(MOCK_API_URL);
      expect(req.request.method).toBe("GET");
      req.flush(MOCK_RESPONSE);
    });

    it("should handle errors from getGlobalAnnouncement", () => {
      service.getGlobalAnnouncement().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });
      const req = httpMock.expectOne(MOCK_API_URL);
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("updateGlobalAnnouncement", () => {
    const MOCK_UPDATE_REQUEST: UpdateAnnouncementApiRequest = {
      htmlAnnouncement: "<b>Updated Announcement</b>",
      enabled: false,
      showWarning: true,
    };

    it("should call updateGlobalAnnouncement and return the updated announcement response", () => {
      service.updateGlobalAnnouncement(MOCK_UPDATE_REQUEST).subscribe((res) => {
        expect(res).toEqual(MOCK_RESPONSE);
      });
      const req = httpMock.expectOne(MOCK_API_URL);
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toEqual(MOCK_UPDATE_REQUEST);
      req.flush(MOCK_RESPONSE);
    });

    it("should handle errors from updateGlobalAnnouncement", () => {
      service.updateGlobalAnnouncement(MOCK_UPDATE_REQUEST).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });
      const req = httpMock.expectOne(MOCK_API_URL);
      req.flush("Update failed", {
        status: 400,
        statusText: "Bad Request",
      });
    });
  });
});
