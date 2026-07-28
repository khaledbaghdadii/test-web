import { executionExistsGuard } from "@mxflow/features/business-process";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { ProjectIdGuardInputResolver } from "@mxflow/features/project";
import { UpgradeActivityComponent } from "./upgrade-activity.component";
import { UpgradeProcessExecutionViewComponent } from "../upgrade-process-execution-view/upgrade-process-execution-view.component";
import { UPGRADE_ACTIVITY_ROUTES } from "./upgrade-activity.routes";

describe("UPGRADE_ACTIVITY_ROUTES", () => {
  it("renders the activity landing page at the empty path", () => {
    const landingRoute = UPGRADE_ACTIVITY_ROUTES.find(
      (route) => route.path === ""
    );

    expect(landingRoute?.component).toBe(UpgradeActivityComponent);
  });

  it("guards the landing page with the AuthorizationGuard and the binary-upgrade family", () => {
    const landingRoute = UPGRADE_ACTIVITY_ROUTES.find(
      (route) => route.path === ""
    );

    expect(landingRoute?.canActivate).toContain(AuthorizationGuard);
    expect(landingRoute?.resolve?.["projectId"]).toBe(
      ProjectIdGuardInputResolver
    );
    expect(landingRoute?.data).toEqual({
      action: "fetch",
      package: "business_process",
      resource: "business_process",
      attributes: {
        familyId: "binary-upgrade",
      },
    });
  });

  it("renders the execution view for a specific execution id", () => {
    const executionRoute = UPGRADE_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.component).toBe(
      UpgradeProcessExecutionViewComponent
    );
  });

  it("guards the execution view with the executionExists guard", () => {
    const executionRoute = UPGRADE_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.canActivate).toContain(executionExistsGuard);
  });

  it("propagates the analytics title to child routes for the execution view", () => {
    const executionRoute = UPGRADE_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.data?.["details"]).toEqual({
      analyticsTitle: "BP Execution",
    });
    expect(executionRoute?.data?.["propagateTitleToChildren"]).toBe(true);
  });
});
