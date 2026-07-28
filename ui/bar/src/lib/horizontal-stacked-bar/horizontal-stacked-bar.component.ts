import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SkeletonModule } from "primeng/skeleton";
import { MeterGroup, MeterItem } from "primeng/metergroup";
import { StackedBarItem } from "./stacked-bar-data.model";
import { TooltipModule } from "primeng/tooltip";

@Component({
  imports: [CommonModule, SkeletonModule, MeterGroup, TooltipModule],
  selector: "mxevolve-horizontal-stacked-bar",
  templateUrl: "./horizontal-stacked-bar.component.html",
})
export class HorizontalStackedBarComponent {
  private _stackedBarItems: StackedBarItem[];
  noDataAvailable = false;
  value: MeterItem[] = [];
  total: number;

  @Input() isLoading: boolean;
  @Input() set stackedBarItems(input: StackedBarItem[] | undefined) {
    if (input) {
      this._stackedBarItems = input;
      this.noDataAvailable = this.areAllItemValuesNull(input);
      this.initializeBarChart();
    }
  }
  get stackedBarItems() {
    return this._stackedBarItems;
  }

  initializeBarChart() {
    this.total = this._stackedBarItems.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0
    );
    this.value = this._stackedBarItems.map((item) => ({
      label: item.label,
      color: item.color,
      value: item.value,
    }));
  }

  areAllItemValuesNull(input: StackedBarItem[]): boolean {
    for (const dataset of input) {
      if (dataset.value !== null) {
        return false;
      }
    }
    return true;
  }
}
