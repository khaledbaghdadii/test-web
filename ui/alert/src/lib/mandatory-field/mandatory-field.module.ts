import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MandatoryFieldComponent } from "./mandatory-field.component";

@NgModule({
  imports: [CommonModule],
  exports: [MandatoryFieldComponent],
  declarations: [MandatoryFieldComponent],
})
export class MandatoryFieldModule {}
