import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CollapsibleMessageComponent } from "./collapsible-message/collapsible-message.component";

@NgModule({
  imports: [CommonModule],
  declarations: [CollapsibleMessageComponent],
  exports: [CollapsibleMessageComponent],
})
export class UiCollapsibleMessageModule {}
