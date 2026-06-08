import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { CiProcessExecutionAction } from "../state";
import { Router } from "@angular/router";
import { CI_PROCESS_MFE_PATH } from "@mxflow/config";

@Injectable()
export class CiProcessExecutionStateUpdaterService {
  constructor(private store: Store, private router: Router) {}

  reloadProcessDetails(
    processId: string,
    projectId: string,
    delay: number = 500,
    callback: any = () => {}
  ) {
    setTimeout(() => {
      this.router.navigateByUrl(
        `/app/${projectId}/business-process/${CI_PROCESS_MFE_PATH}/execution/${processId}`
      );
      this.store.dispatch(
        CiProcessExecutionAction.getCiProcessExecution({
          id: processId,
          projectId: projectId,
        })
      );
      callback();
    }, delay);
  }
}
