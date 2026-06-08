import { CreateBranchStageDetailsComponent } from "@mxflow/features/business-process";
import { ScmManagementService } from "@mxflow/features/scm";
import { v4 as uuidv4 } from "uuid";
import { firstValueFrom, of, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import spyOn = jest.spyOn;
import { ActivatedRoute } from "@angular/router";

describe("Create branch stage details component test", () => {
  const projectId = uuidv4();
  const developmentId = uuidv4();
  const errorMessage = uuidv4();

  let scmService: ScmManagementService;
  let messageService: ToastMessageService;
  let component: CreateBranchStageDetailsComponent;
  let activatedRoute: ActivatedRoute;

  beforeEach(() => {
    scmService = {
      getDevelopment: jest.fn(() => of({})),
    } as unknown as ScmManagementService;

    messageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    activatedRoute = {
      snapshot: {
        params: {
          projectId,
        },
      },
    } as unknown as ActivatedRoute;

    component = new CreateBranchStageDetailsComponent(
      scmService,
      messageService,
      activatedRoute
    );

    component.developmentId = developmentId;
  });

  describe("On init", () => {
    it("should fetch development with correct project id", async () => {
      component.ngOnInit();
      await firstValueFrom(component.development$);

      expect(scmService.getDevelopment).toHaveBeenCalledWith(
        projectId,
        expect.anything(),
        expect.anything()
      );
    });

    it("should fetch the development with correct development id", async () => {
      component.ngOnInit();
      await firstValueFrom(component.development$);

      expect(scmService.getDevelopment).toHaveBeenCalledWith(
        expect.anything(),
        developmentId,
        expect.anything()
      );
    });

    it("should fetch the development by indicating that the development should be returned even if it was deleted", async () => {
      component.ngOnInit();
      await firstValueFrom(component.development$);
      expect(scmService.getDevelopment).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        true
      );
    });

    it("should not fetch the development if the development id is null", () => {
      component.developmentId = null as unknown as string;
      component.ngOnInit();
      expect(scmService.getDevelopment).toHaveBeenCalledTimes(0);
    });

    it("should show error message in case of error", (done) => {
      spyOn(scmService, "getDevelopment").mockReturnValue(
        throwError(() => errorMessage)
      );

      component.ngOnInit();
      component.development$.subscribe((development) => {
        expect(development).toStrictEqual(undefined);
        expect(messageService.showError).toHaveBeenCalledWith(errorMessage);
        done();
      });
    });
  });
});
