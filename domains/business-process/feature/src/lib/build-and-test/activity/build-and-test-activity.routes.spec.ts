import { executionExistsGuard } from "@mxflow/features/business-process";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { ProjectIdGuardInputResolver } from "@mxflow/features/project";
import { BuildAndTestActivityComponent } from "./build-and-test-activity.component";
import { BuildAndTestExecutionViewComponent } from "../build-and-test-execution-view/build-and-test-execution-view.component";
import { BUILD_AND_TEST_ACTIVITY_ROUTES } from "./build-and-test-activity.routes";

describe("BUILD_AND_TEST_ACTIVITY_ROUTES", () => {
  it("renders the activity landing page at the empty path", () => {
    const landingRoute = BUILD_AND_TEST_ACTIVITY_ROUTES.find(
      (route) => route.path === ""
    );

    expect(landingRoute?.component).toBe(BuildAndTestActivityComponent);
  });

  it("guards the landing page with the AuthorizationGuard and the user-story-build-and-test family", () => {
    const landingRoute = BUILD_AND_TEST_ACTIVITY_ROUTES.find(
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
        familyId: "user-story-build-and-test",
      },
    });
  });

  it("renders the execution view for a specific execution id", () => {
    const executionRoute = BUILD_AND_TEST_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.component).toBe(BuildAndTestExecutionViewComponent);
  });

  it("guards the execution view with the executionExists guard", () => {
    const executionRoute = BUILD_AND_TEST_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.canActivate).toContain(executionExistsGuard);
  });

  it("propagates the analytics title to child routes for the execution view", () => {
    const executionRoute = BUILD_AND_TEST_ACTIVITY_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.data?.["details"]).toEqual({
      analyticsTitle: "BP Execution",
    });
    expect(executionRoute?.data?.["propagateTitleToChildren"]).toBe(true);
  });
});
