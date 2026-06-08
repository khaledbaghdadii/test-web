import { ActivatedRouteSnapshot, Resolve } from "@angular/router";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ProjectIdGuardInputResolver implements Resolve<string> {
  resolve(activateRouteSnapshot: ActivatedRouteSnapshot): string {
    const projectId = activateRouteSnapshot.params?.["projectId"];
    if (!projectId) {
      throw new Error("No Project Found");
    }
    return projectId;
  }
}
