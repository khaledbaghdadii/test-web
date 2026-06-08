import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { AnnouncementApiResponse } from "../model/announcement-api-response";
import { UpdateAnnouncementApiRequest } from "../model/update-announcement-api-request";

@Injectable({
  providedIn: "root",
})
export class AnnouncementBannerService {
  apiUrl: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.apiUrl = config.gatewayUrl;
  }

  getGlobalAnnouncement(): Observable<AnnouncementApiResponse> {
    const url = this.getAnnouncementBannerApiUrl();
    return this.http
      .get<AnnouncementApiResponse>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateGlobalAnnouncement(
    updateAnnouncementApiRequest: UpdateAnnouncementApiRequest
  ): Observable<AnnouncementApiResponse> {
    const url = this.getAnnouncementBannerApiUrl();
    return this.http
      .put<AnnouncementApiResponse>(url, updateAnnouncementApiRequest)
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getAnnouncementBannerApiUrl(): string {
    return `${this.apiUrl}projects/announcements`;
  }
}
