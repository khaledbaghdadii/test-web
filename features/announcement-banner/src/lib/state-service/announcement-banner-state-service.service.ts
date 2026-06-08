import { BehaviorSubject, firstValueFrom } from "rxjs";
import { Injectable, inject } from "@angular/core";
import { AnnouncementBannerModel } from "../model/announcement-banner-model";
import { AnnouncementBannerService } from "../service/announcement-banner.service";
import { ToastMessageService } from "@mxflow/ui/alert";

@Injectable({ providedIn: "root" })
export class AnnouncementBannerStateService {
  private _announcement = new BehaviorSubject<AnnouncementBannerModel | null>(
    null
  );
  readonly announcement$ = this._announcement.asObservable();

  private readonly announcementBannerService = inject(
    AnnouncementBannerService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private initialized = false;

  setAnnouncement(value: AnnouncementBannerModel) {
    this._announcement.next(value);
  }

  get current(): AnnouncementBannerModel | null {
    return this._announcement.value;
  }

  async getGlobalAnnouncementBanner(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const res = await firstValueFrom(
        this.announcementBannerService.getGlobalAnnouncement()
      );
      this.setAnnouncement({
        htmlAnnouncement: res.htmlAnnouncement,
        enabled: res.enabled,
        showWarning: res.showWarning,
      });
    } catch (error) {
      this.setAnnouncement({
        htmlAnnouncement: "",
        enabled: false,
        showWarning: false,
      });
      this.showError("Failed to load announcement banner:", error);
    }
  }

  async updateAnnouncement(update: AnnouncementBannerModel): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.announcementBannerService.updateGlobalAnnouncement({
          enabled: update.enabled,
          htmlAnnouncement: update.htmlAnnouncement ?? "",
          showWarning: update.showWarning,
        })
      );

      const result: AnnouncementBannerModel = {
        htmlAnnouncement: res.htmlAnnouncement,
        enabled: res.enabled,
        showWarning: res.showWarning,
      };

      this.setAnnouncement(result);
      this.toastMessageService.showSuccess(
        "Announcement banner updated successfully"
      );
    } catch (error) {
      this.showError("Failed to update announcement banner", error);
      throw error;
    }
  }

  private showError(prefix: string, error: unknown) {
    const backendError = (
      error as {
        error?: {
          errors?: Record<string, string>;
          message?: string;
        };
      }
    )?.error;
    if (backendError?.errors && typeof backendError.errors === "object") {
      const errorMessage = Object.values(backendError.errors).join(" ");
      this.toastMessageService.showError(prefix, errorMessage);
      return;
    }
    if (backendError?.message) {
      this.toastMessageService.showError(prefix, backendError.message);
      return;
    }
    this.toastMessageService.showError(prefix, "An unknown error occurred.");
  }
}
