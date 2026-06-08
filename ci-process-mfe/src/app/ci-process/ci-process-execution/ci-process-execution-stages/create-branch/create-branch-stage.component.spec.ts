import { CreateBranchStageComponent } from "./create-branch-stage.component";
import { Store } from "@ngrx/store";
import { lastValueFrom, of } from "rxjs";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import {
  BuildAndTestProcessCreateBranchStage,
  BuildAndTestProcessExecution,
} from "@mxflow/features/business-process";
import { v4 as uuidv4 } from "uuid";

describe("create stage component", () => {
  const developmentId = uuidv4();
  const errorMessage = uuidv4();

  let store: Store;
  let component: CreateBranchStageComponent;

  beforeEach(() => {
    store = {
      pipe: jest.fn(() => of(constructCiProcessExecution())),
    } as unknown as Store;

    component = new CreateBranchStageComponent(store);
  });

  describe("On Init", () => {
    it("should fetch the ci process execution from the store", async () => {
      component.ngOnInit();
      await lastValueFrom(component.stage$);

      expect(store.pipe).toHaveBeenCalledWith(getCiProcessExecution);
    });

    it("should return the stage with correct development Id", async () => {
      component.ngOnInit();
      const stage = await lastValueFrom(component.stage$);

      expect(stage.developmentId).toStrictEqual(developmentId);
    });

    it("should return the stage with correct error message", async () => {
      component.ngOnInit();
      const stage = await lastValueFrom(component.stage$);

      expect(stage.errorMessage).toStrictEqual(errorMessage);
    });

    it("should return the stage with correct create branch flag", async () => {
      component.ngOnInit();
      const stage = await lastValueFrom(component.stage$);

      expect(stage.createBranch).toStrictEqual(true);
    });
  });

  function constructCiProcessExecution() {
    return {
      createBranchStage: {
        developmentId: developmentId,
        errorMessage: errorMessage,
        createBranch: true,
      } as BuildAndTestProcessCreateBranchStage,
    } as BuildAndTestProcessExecution;
  }
});
