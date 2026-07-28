import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WarningAlertComponent } from "./warning-alert.component";
import { MessageModule } from "primeng/message";

@NgModule({
  imports: [CommonModule, MessageModule],
  exports: [WarningAlertComponent],
  declarations: [WarningAlertComponent],
})
export class WarningAlertModule {}
