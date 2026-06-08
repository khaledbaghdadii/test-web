import { ActivatedRouteSnapshot, CanActivateFn, Router } from "@angular/router";
import { BusinessProcessExecutionService } from "@mxflow/features/business-process";
import { inject } from "@angular/core";
import { catchError, map, of } from "rxjs";

export const executionExistsGuard: CanActivateFn = (
  next: ActivatedRouteSnapshot
) => {
  const service: BusinessProcessExecutionService = inject(
    BusinessProcessExecutionService
  );
  const router: Router = inject(Router);

  const projectId = next.paramMap.get("projectId");
  const executionId = next.paramMap.get("executionId");

  return service.businessProcessExists(projectId ?? "", executionId ?? "").pipe(
    catchError(() => of(false)),
    map((value) => {
      return !!value || router.createUrlTree(["/not-found"]);
    })
  );
};
