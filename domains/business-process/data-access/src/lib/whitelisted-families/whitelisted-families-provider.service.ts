import { inject, Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import { AuthorizationService, EvaluatePolicyInput } from "@mxflow/core/auth";

@Injectable()
export class WhitelistedFamiliesProvider {
  private readonly authorizationService = inject(AuthorizationService);

  getWhitelistedFamilies(projectId: string): Observable<string[]> {
    return this.authorizationService
      .evaluatePolicy<WhiteListedFamilies>({
        package: "business_process",
        resource: "white_listed_families",
        policy: "whiteListedFamilies",
        projectId,
      } as EvaluatePolicyInput)
      .pipe(
        map((result) => result?.whiteListedFamiliesIds ?? []),
        catchError(() => of([]))
      );
  }
}

export interface WhiteListedFamilies {
  whiteListedFamiliesIds?: string[];
}
