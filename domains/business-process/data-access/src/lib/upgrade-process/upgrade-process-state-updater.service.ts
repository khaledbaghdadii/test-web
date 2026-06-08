import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BINARY_UPGRADE_MFE_PATH } from "@mxevolve/shared/core/config";

@Injectable()
export class UpgradeProcessStateUpdaterService {
  private readonly router = inject(Router);

  reloadProcessDetails(processId: string, projectId: string, delay = 1000) {
    setTimeout(() => {
      this.router
        .navigateByUrl(
          `/app/${projectId}/business-process/${BINARY_UPGRADE_MFE_PATH}/execution/${processId}`
        )
        .then(() => window.location.reload());
    }, delay);
  }
}
