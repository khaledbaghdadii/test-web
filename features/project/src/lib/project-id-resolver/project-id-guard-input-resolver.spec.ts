import { ProjectIdGuardInputResolver } from "./project-id-guard-input-resolver";
import { v4 as uuidv4 } from "uuid";
import { ActivatedRouteSnapshot } from "@angular/router";

describe("ProjectIdGuardInputResolver", () => {
  it("should resolve the current project id", () => {
    const activatedRouteSnapshot = {
      params: {
        projectId: uuidv4(),
      },
    } as unknown as ActivatedRouteSnapshot;
    const routeParamsResolver = new ProjectIdGuardInputResolver();
    const actualProjectId = routeParamsResolver.resolve(activatedRouteSnapshot);
    expect(actualProjectId).toEqual(
      activatedRouteSnapshot.params?.["projectId"]
    );
  });
  it("should throw an error if projectId is not found", () => {
    const activatedRouteSnapshot = {
      params: {},
    } as unknown as ActivatedRouteSnapshot;
    const routeParamsResolver = new ProjectIdGuardInputResolver();
    expect(() => routeParamsResolver.resolve(activatedRouteSnapshot)).toThrow(
      "No Project Found"
    );
  });
});
