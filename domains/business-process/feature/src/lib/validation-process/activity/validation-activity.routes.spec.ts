import { executionExistsGuard } from "@mxflow/features/business-process";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { ProjectIdGuardInputResolver } from "@mxflow/features/project";
import { ValidationActivityComponent } from "./validation-activity.component";
import { ValidationProcessExecutionViewComponent } from "../validation-process-execution-view/validation-process-execution-view.component";
import { VALIDATION_ACTIVITY_ROUTES } from "./validation-activity.routes";

describe("VALIDATION_ACTIVITY_ROUTES", () => {
  it("renders the activity landing page at the empty path", () => {
    const landingRoute = VALIDATION_ACTIVITY_ROUTES.find(
      (route) => route.path === ""
    );

    expect(landingRoute?.component).toBe(ValidationActivityComponent);
  });

  it("guards the landing page with the AuthorizationGuard and the master-validation family", () => {
    const landingRoute = VALIDATION_ACTIVITY_ROUTES.find(
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
        familyId: "master-validation",
      },
    });
  });

  it("renders the execution view for a specific execution id", () => {
    const executionRoute = VALIDATION_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.component).toBe(
      ValidationProcessExecutionViewComponent
    );
  });

  it("guards the execution view with the executionExists guard", () => {
    const executionRoute = VALIDATION_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.canActivate).toContain(executionExistsGuard);
  });

  it("propagates the analytics title to child routes for the execution view", () => {
    const executionRoute = VALIDATION_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.data?.["details"]).toEqual({
      analyticsTitle: "BP Execution",
    });
    expect(executionRoute?.data?.["propagateTitleToChildren"]).toBe(true);
  });
});
