import { executionExistsGuard } from "@mxflow/features/business-process";
import { VALIDATION_PROCESS_ROUTES } from "./validation-process.routes";
import { ValidationProcessExecutionViewComponent } from "./validation-process-execution-view/validation-process-execution-view.component";
import { ValidationActivityComponent } from "./activity/validation-activity.component";

describe("VALIDATION_PROCESS_ROUTES", () => {
  it("redirects the empty path to executions", () => {
    const defaultRoute = VALIDATION_PROCESS_ROUTES.find((r) => r.path === "");

    expect(defaultRoute?.redirectTo).toBe("executions");
  });

  it("matches the full empty path before redirecting", () => {
    const defaultRoute = VALIDATION_PROCESS_ROUTES.find((r) => r.path === "");

    expect(defaultRoute?.pathMatch).toBe("full");
  });

  it("renders the executions component on the executions path", () => {
    const executionsRoute = VALIDATION_PROCESS_ROUTES.find(
      (r) => r.path === "executions"
    );

    expect(executionsRoute?.component).toBe(ValidationActivityComponent);
  });

  it("renders the execution view component on the execution detail path", () => {
    const executionRoute = VALIDATION_PROCESS_ROUTES.find(
      (r) => r.path === "execution/:executionId"
    );

    expect(executionRoute?.component).toBe(
      ValidationProcessExecutionViewComponent
    );
  });

  it("guards the execution detail path with the execution-exists guard", () => {
    const executionRoute = VALIDATION_PROCESS_ROUTES.find(
      (r) => r.path === "execution/:executionId"
    );

    expect(executionRoute?.canActivate).toContain(executionExistsGuard);
  });

  it("sets the analytics title on the execution detail path", () => {
    const executionRoute = VALIDATION_PROCESS_ROUTES.find(
      (r) => r.path === "execution/:executionId"
    );

    expect(executionRoute?.data?.["details"].analyticsTitle).toBe(
      "BP Execution"
    );
  });

  it("propagates the title to children on the execution detail path", () => {
    const executionRoute = VALIDATION_PROCESS_ROUTES.find(
      (r) => r.path === "execution/:executionId"
    );

    expect(executionRoute?.data?.["propagateTitleToChildren"]).toBe(true);
  });
});
