import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InputProviderComponent } from "./input-provider.component";
import { ChipModule } from "primeng/chip";

@NgModule({
  imports: [CommonModule, ChipModule],
  exports: [InputProviderComponent],
  declarations: [InputProviderComponent],
})
export class InputProviderModule {}
