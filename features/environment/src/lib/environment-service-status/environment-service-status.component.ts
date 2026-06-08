import { TagModule } from "primeng/tag";
import { CommonModule } from "@angular/common";
import { Component, Input, NgModule } from "@angular/core";
import { EnvironmentServiceStatus } from "./environment-service-status";

@Component({
  selector: "mxevolve-environment-service-status",
  templateUrl: "./environment-serivce-status.component.html",
  standalone: false,
})
export class EnvironmentServiceStatusComponent {
  @Input() serviceStatus: string;

  isServiceRunning() {
    return (
      this.serviceStatus.toLowerCase() ===
      EnvironmentServiceStatus.RUNNING.toLowerCase()
    );
  }

  isNotValidStatus() {
    return this.serviceStatus === EnvironmentServiceStatus.UNDEFINED;
  }
}

@NgModule({
  imports: [CommonModule, TagModule],
  declarations: [EnvironmentServiceStatusComponent],
  exports: [EnvironmentServiceStatusComponent],
})
export class EnvironmentServiceStatusModule {}
