import { AllRunsActivityComponent } from "./activity/all-runs-activity.component";
import { ALL_RUNS_PROCESS_ROUTES } from "./all-runs-process.routes";

describe("ALL_RUNS_PROCESS_ROUTES", () => {
  it("redirects the process root to executions", () => {
    expect(ALL_RUNS_PROCESS_ROUTES[0]).toEqual({
      path: "",
      redirectTo: "executions",
      pathMatch: "full",
    });
  });

  it("renders the All Runs activity page at executions", () => {
    expect(ALL_RUNS_PROCESS_ROUTES[1]).toEqual({
      path: "executions",
      component: AllRunsActivityComponent,
    });
  });
});
