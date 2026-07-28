import { Component, EventEmitter, Input, Output } from "@angular/core";

import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { FormsModule } from "@angular/forms";
import { RadioButtonModule } from "primeng/radiobutton";

interface Options {
  text: string;
  value: string;
}

@Component({
  imports: [ButtonModule, DividerModule, FormsModule, RadioButtonModule],
  selector: "mxflow-table-radio-button-filter",
  templateUrl: "./table-radio-button-filter.component.html",
})
export class TableRadioButtonFilterComponent {
  @Input() options: Options[];
  @Input() filter: any;
  @Input() selected: string;
  @Output() selectedChange = new EventEmitter<string>();

  onSelect() {
    this.filter(this.selected);
    this.selectedChange.emit(this.selected);
  }

  clearSelectedStatuses() {
    this.selected = "";
    this.filter("");
    this.selectedChange.emit();
  }
}
