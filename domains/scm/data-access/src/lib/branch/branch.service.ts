import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import {
  BranchDetails,
  BranchDetailsError,
  GetBranchDetailsRequest,
} from "./branch-details.model";

/**
 * Migrated from the legacy `web/libs/features/scm/src/lib/scm.service.ts`
 * `getBranchDetails`: fetches a branch's head-commit details
 * (GET scm-operations/projects/{projectId}/repositories/{repositoryId}/branches?branchName=…).
 *
 * A 404 means the branch does not exist. The originating HTTP status is
 * preserved on the thrown {@link BranchDetailsError} so branch-existence
 * validators can react to it (mirroring the legacy `err.status === 404` check).
 */
@Injectable({ providedIn: "root" })
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getBranchDetails(
    request: GetBranchDetailsRequest
  ): Observable<BranchDetails> {
    const params = new HttpParams().set("branchName", request.branchName);
    return this.http
      .get<BranchDetails>(this.branchDetailsUrl(request), { params })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(
            () =>
              new BranchDetailsError(
                error?.error?.message ??
                  error?.message ??
                  "Failed to fetch branch details",
                error?.status
              )
          )
        )
      );
  }

  private branchDetailsUrl(request: GetBranchDetailsRequest): string {
    return (
      `${this.config.gatewayUrl}scm-operations/projects/${request.projectId}` +
      `/repositories/${request.repositoryId}/branches`
    );
  }
}
