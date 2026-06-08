import { Router } from "@angular/router";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { CI_PROCESS_MFE_PATH } from "@mxevolve/shared/core/config";
import { BuildAndTestProcessStateUpdaterService } from "./build-and-test-process-state-updater.service";

describe("when reloading the state of the ci process", () => {
  let router: Router;
  let service: BuildAndTestProcessStateUpdaterService;

  beforeEach(() => {
    router = {
      navigateByUrl: jest.fn(),
    } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        BuildAndTestProcessStateUpdaterService,
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(BuildAndTestProcessStateUpdaterService);

    router.navigateByUrl.mockReturnValue(Promise.resolve(true));
  });

  it("should navigate to the ci process details url after the specified delay is passed", fakeAsync(() => {
    service.reloadProcessDetails("processId", "projectId", 1000);
    tick(1000);
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      `/app/projectId/business-process/${CI_PROCESS_MFE_PATH}/execution/processId`
    );
  }));

  it("should not navigate before the delay finishes", fakeAsync(() => {
    service.reloadProcessDetails("processId", "projectId", 1000);
    tick(900);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    tick(100);
  }));
});
