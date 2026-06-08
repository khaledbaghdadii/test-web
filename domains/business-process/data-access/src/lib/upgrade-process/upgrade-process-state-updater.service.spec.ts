import { Router } from "@angular/router";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { BINARY_UPGRADE_MFE_PATH } from "@mxevolve/shared/core/config";
import { UpgradeProcessStateUpdaterService } from "./upgrade-process-state-updater.service";

describe("when reloading the state of the process", () => {
  let router: Router;
  let service: UpgradeProcessStateUpdaterService;

  beforeEach(() => {
    router = {
      navigateByUrl: jest.fn(),
    } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        UpgradeProcessStateUpdaterService,
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(UpgradeProcessStateUpdaterService);

    router.navigateByUrl.mockReturnValue(Promise.resolve(true));
  });

  it("should navigate to the process details url after the specified delay is passed", fakeAsync(() => {
    service.reloadProcessDetails("processId", "projectId", 1000);
    tick(1000);
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      `/app/projectId/business-process/${BINARY_UPGRADE_MFE_PATH}/execution/processId`
    );
  }));

  it("should not do the navigate before the delay finishes", fakeAsync(() => {
    service.reloadProcessDetails("processId", "projectId", 1000);
    tick(900);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    tick(100);
  }));
});
