import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BUILD_AND_TEST_PROCESS_PATH } from "@mxevolve/shared/core/config";

@Injectable()
export class BuildAndTestProcessStateUpdaterService {
  private readonly router = inject(Router);

  reloadProcessDetails(processId: string, projectId: string, delay = 1000) {
    setTimeout(() => {
      this.router
        .navigateByUrl(
          `/app/${projectId}/business-process/${BUILD_AND_TEST_PROCESS_PATH}/execution/${processId}`
        )
        .then(() => window.location.reload());
    }, delay);
  }
}
