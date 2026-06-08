import { AnnouncementBannerStateService } from "./announcement-banner-state-service.service";
import { AnnouncementBannerModel } from "../model/announcement-banner-model";
import { of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { AnnouncementBannerService } from "../service/announcement-banner.service";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("AnnouncementBannerStateService", () => {
  let service: AnnouncementBannerStateService;
  let mockAnnouncementBannerService: {
    getGlobalAnnouncement: jest.Mock;
    updateGlobalAnnouncement: jest.Mock;
  };
  let mockToastMessageService: {
    showSuccess: jest.Mock;
    showError: jest.Mock;
  };

  const mockAnnouncement: AnnouncementBannerModel = {
    htmlAnnouncement: "<b>Test</b>",
    enabled: true,
    showWarning: false,
  };

  beforeEach(() => {
    mockAnnouncementBannerService = {
      getGlobalAnnouncement: jest.fn(),
      updateGlobalAnnouncement: jest.fn(),
    };
    mockToastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        AnnouncementBannerStateService,
        {
          provide: AnnouncementBannerService,
          useValue: mockAnnouncementBannerService,
        },
        { provide: ToastMessageService, useValue: mockToastMessageService },
      ],
    });
    service = TestBed.inject(AnnouncementBannerStateService);
  });

  it("should emit the announcement when setAnnouncement is called", (done) => {
    service.announcement$.subscribe((value) => {
      if (value) {
        expect(value).toEqual(mockAnnouncement);
        done();
      }
    });
    service.setAnnouncement(mockAnnouncement);
  });

  it("should return the current value via the current getter", () => {
    expect(service.current).toBeNull();
    service.setAnnouncement(mockAnnouncement);
    expect(service.current).toEqual(mockAnnouncement);
  });

  describe("getGlobalAnnouncementBanner", () => {
    it("should set and emit the announcement on success", async () => {
      mockAnnouncementBannerService.getGlobalAnnouncement.mockReturnValue(
        of(mockAnnouncement)
      );
      await service.getGlobalAnnouncementBanner();
      expect(service.current).toEqual(mockAnnouncement);
    });

    it("should set default and show error on failure", async () => {
      mockAnnouncementBannerService.getGlobalAnnouncement.mockReturnValue(
        throwError(() => new Error("fail"))
      );
      await service.getGlobalAnnouncementBanner();
      expect(service.current).toEqual({
        htmlAnnouncement: "",
        enabled: false,
        showWarning: false,
      });
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to load announcement banner:",
        "An unknown error occurred."
      );
    });
  });

  describe("updateAnnouncement", () => {
    it("should update and emit the announcement on success", async () => {
      mockAnnouncementBannerService.updateGlobalAnnouncement.mockReturnValue(
        of(mockAnnouncement)
      );
      await service.updateAnnouncement(mockAnnouncement);
      expect(service.current).toEqual(mockAnnouncement);
      expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
        "Announcement banner updated successfully"
      );
    });

    it("should show error and throw on failure", async () => {
      mockAnnouncementBannerService.updateGlobalAnnouncement.mockReturnValue(
        throwError(() => new Error("update fail"))
      );
      await expect(
        service.updateAnnouncement(mockAnnouncement)
      ).rejects.toThrow("update fail");
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to update announcement banner",
        "An unknown error occurred."
      );
    });

    it("should extract and show field-level errors from backend response", async () => {
      const backendError = {
        status: 400,
        message: "Validation failed",
        timestamp: "2025-06-20T09:44:31.114Z",
        errors: {
          htmlAnnouncement: "Html announcement must not be null nor empty",
        },
      };

      mockAnnouncementBannerService.updateGlobalAnnouncement.mockReturnValue(
        throwError(() => ({
          error: backendError,
        }))
      );

      await expect(
        service.updateAnnouncement(mockAnnouncement)
      ).rejects.toEqual({ error: backendError });

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to update announcement banner",
        "Html announcement must not be null nor empty"
      );
    });
  });
});
