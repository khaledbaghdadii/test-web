import { Component, EventEmitter, Input, Output } from "@angular/core";

import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { MultiSelectModule } from "primeng/multiselect";
import { ProjectSelectOption } from "../../../../../../apps/environment-management/src/app/shared/interfaces/project/project-select-option";

@Component({
  imports: [ButtonModule, MultiSelectModule, FormsModule],
  selector: "mxflow-table-search-checkbox-filter",
  templateUrl: "./table-search-checkbox-filter.component.html",
  styleUrls: ["./table-search-checkbox-filter.component.scss"],
})
export class TableSearchCheckboxFilterComponent {
  @Input() options: ProjectSelectOption[];
  @Input() filter: any;
  @Input() placeholder: string;

  @Input() selected: string[];
  @Output() selectedChange = new EventEmitter<string[]>();

  onClear() {
    this.selected = [];
    this.selectedChange.emit([]);
    this.filter([]);
  }

  onProjectSelected(): void {
    this.selectedChange.emit(this.selected);
    this.filter(this.selected);
  }
}
