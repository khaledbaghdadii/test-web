import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { ClientImpactNoteAffectedVersionsConfigApiModel } from "./client-impact-note-affected-versions-config-api-model";
import { ClientImpactNoteFieldType } from "./client-impact-note-field-type.enum";
import { ClientImpactNoteOption } from "./client-impact-note-option.model";

@Injectable({
  providedIn: "root",
})
export class ClientImpactNoteService {
  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly http = inject(HttpClient);

  fetch(type: ClientImpactNoteFieldType): Observable<ClientImpactNoteOption[]> {
    const url = `${this.config.gatewayUrl}failure-management/client-impact-note/fields`;
    const params = new HttpParams({ fromObject: { type } });
    return this.http
      .get<ClientImpactNoteOption[]>(url, { params })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetchAllowedVersionsConfiguration(): Observable<ClientImpactNoteAffectedVersionsConfigApiModel> {
    const url = `${this.config.gatewayUrl}failure-management/client-impact-note/affected-versions/allowed-versions-configuration`;
    return this.http.get<ClientImpactNoteAffectedVersionsConfigApiModel>(url);
  }
}
