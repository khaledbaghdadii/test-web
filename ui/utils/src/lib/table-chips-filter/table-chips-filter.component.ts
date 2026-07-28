import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AutoCompleteModule } from "primeng/autocomplete";

@Component({
  selector: "mxevolve-table-chips-filter",
  imports: [FormsModule, AutoCompleteModule],
  template: `
    <p-autocomplete
      [(ngModel)]="values"
      multiple
      fluid
      (keyup.enter)="search()"
      (onUnselect)="search()"
      [typeahead]="false"
    />
  `,
})
export class TableChipsFilterComponent {
  @Input() filter: (values: string[]) => void;
  @Input() values: string[] = [];
  @Output() valuesChange = new EventEmitter<string[]>();

  search() {
    this.filter(this.values);
    this.valuesChange.emit(this.values);
  }
}
