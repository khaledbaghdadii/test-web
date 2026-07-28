import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardContainerComponent } from "./card-container.component";
import { CardModule } from "primeng/card";

@NgModule({
  imports: [CommonModule, CardModule],
  exports: [CardContainerComponent],
  declarations: [CardContainerComponent],
})
export class CardContainerModule {}
