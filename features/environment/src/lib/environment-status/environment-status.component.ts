import { Component, Input } from "@angular/core";

import { EnvironmentStatusNamePipe } from "./environment-status-name.pipe";

import {
  environmentDeploymentFailureStatuses,
  EnvironmentStatus,
  environmentUnfinishedDeploymentStatuses,
} from "./environment-status";

@Component({
  imports: [EnvironmentStatusNamePipe],
  selector: "mxevolve-environment-status",
  templateUrl: "./environment-status.component.html",
})
export class EnvironmentStatusComponent {
  @Input() environmentStatus?: EnvironmentStatus | null;
  isEnvironmentPassed() {
    return this.environmentStatus === EnvironmentStatus.READY;
  }

  isEnvironmentFailed() {
    return (
      this.environmentStatus != null &&
      environmentDeploymentFailureStatuses.includes(this.environmentStatus)
    );
  }

  isEnvironmentUnderway() {
    return (
      this.environmentStatus != null &&
      environmentUnfinishedDeploymentStatuses.includes(this.environmentStatus)
    );
  }

  isEnvironmentNeutral() {
    return (
      this.environmentStatus === EnvironmentStatus.CLEANED ||
      this.environmentStatus === EnvironmentStatus.CLEANING ||
      this.environmentStatus === EnvironmentStatus.CLEAN_FAILED
    );
  }

  isNotValidStatus() {
    return (
      !this.isEnvironmentPassed() &&
      !this.isEnvironmentFailed() &&
      !this.isEnvironmentNeutral() &&
      !this.isEnvironmentUnderway()
    );
  }
}
