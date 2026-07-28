import { Component, EventEmitter, Input, Output } from "@angular/core";

import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DividerModule } from "primeng/divider";
import { FormsModule } from "@angular/forms";
import { MxflowSpinnerModule } from "../spinner/mxflow-spinner.module";
import { SkeletonModule } from "primeng/skeleton";
import { Tooltip } from "primeng/tooltip";

interface Options {
  text: string;
  value: string;
  byDefault?: boolean;
}

@Component({
  imports: [
    ButtonModule,
    CheckboxModule,
    DividerModule,
    FormsModule,
    MxflowSpinnerModule,
    SkeletonModule,
    Tooltip,
  ],
  selector: "mxevolve-table-checkbox-filter",
  templateUrl: "./table-checkbox-filter.component.html",
  styleUrls: ["./table-checkbox-filter.component.css"],
})
export class TableCheckboxFilterComponent {
  @Input() options: Options[];

  @Input() filter: any;
  @Input() limitWidth: boolean;
  @Input() isLoading = false;
  @Input() selected: string[];
  @Output() selectedChange = new EventEmitter<string[]>();

  onSelect() {
    if (this.filter) this.filter(this.selected);
    this.selectedChange.emit(this.selected);
  }

  clearSelectedStatuses() {
    if (this.filter) this.filter([]);
    this.selected = [];
    this.selectedChange.emit([]);
  }
}
