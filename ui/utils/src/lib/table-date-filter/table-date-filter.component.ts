import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CheckboxModule } from "primeng/checkbox";
import { DividerModule } from "primeng/divider";
import { ButtonModule } from "primeng/button";
import { DatePicker } from "primeng/datepicker";

@Component({
  imports: [
    FormsModule,
    CheckboxModule,
    ButtonModule,
    DividerModule,
    DatePicker,
  ],
  selector: "mxflow-table-date-filter",
  templateUrl: "./table-date-filter.component.html",
})
export class TableDateFilterComponent implements OnInit {
  @Input() filter: any;

  @Input() selectedRange: Date[];
  @Output() selectedRangeChange = new EventEmitter<Date[]>();

  ngOnInit(): void {
    console.log("ON init: ", this.selectedRange);
  }

  private getDateAtMidnight(date: Date): Date {
    return new Date(date.toDateString());
  }

  private roundUpToTheNextDay(date: Date): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);
    return this.getDateAtMidnight(result);
  }

  selectRange(): void {
    if (this.selectedRange[0] && this.selectedRange[1]) {
      this.filter([
        this.getDateAtMidnight(this.selectedRange[0]).toISOString(),
        this.roundUpToTheNextDay(this.selectedRange[1]).toISOString(),
      ]);
      this.selectedRangeChange.emit(this.selectedRange);
    }
  }

  reset(): void {
    this.selectedRange = [];
    this.filter([]);
    this.selectedRangeChange.emit([]);
  }

  setDateToToday(): void {
    this.selectedRange = [new Date(), new Date()];
    this.selectRange();
  }

  setDateToPastWeek(): void {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const today = this.getDateAtMidnight(new Date());
    this.selectedRange = [new Date(today.getTime() - oneWeek), new Date()];
    this.selectRange();
  }
}
