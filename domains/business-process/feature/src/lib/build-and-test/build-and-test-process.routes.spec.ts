import { executionExistsGuard } from "@mxflow/features/business-process";
import { BuildAndTestExecutionViewComponent } from "./build-and-test-execution-view/build-and-test-execution-view.component";
import { BUILD_AND_TEST_PROCESS_ROUTES } from "./build-and-test-process.routes";
import { BuildAndTestActivityComponent } from "./activity/build-and-test-activity.component";

describe("BUILD_AND_TEST_PROCESS_ROUTES", () => {
  it("redirects the empty path to the executions list", () => {
    const defaultRoute = BUILD_AND_TEST_PROCESS_ROUTES.find(
      (route) => route.path === ""
    );

    expect(defaultRoute?.redirectTo).toBe("executions");
    expect(defaultRoute?.pathMatch).toBe("full");
  });

  it("renders the executions list at the executions path", () => {
    const executionsRoute = BUILD_AND_TEST_PROCESS_ROUTES.find(
      (route) => route.path === "executions"
    );

    expect(executionsRoute?.component).toBe(BuildAndTestActivityComponent);
  });

  it("renders the execution view for a specific execution id", () => {
    const executionRoute = BUILD_AND_TEST_PROCESS_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.component).toBe(BuildAndTestExecutionViewComponent);
  });

  it("guards the execution view with the executionExists guard", () => {
    const executionRoute = BUILD_AND_TEST_PROCESS_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.canActivate).toContain(executionExistsGuard);
  });

  it("propagates the analytics title to child routes for the execution view", () => {
    const executionRoute = BUILD_AND_TEST_PROCESS_ROUTES.find(
      (route) => route.path === "execution/:executionId"
    );

    expect(executionRoute?.data?.["details"]).toEqual({
      analyticsTitle: "BP Execution",
    });
    expect(executionRoute?.data?.["propagateTitleToChildren"]).toBe(true);
  });
});
