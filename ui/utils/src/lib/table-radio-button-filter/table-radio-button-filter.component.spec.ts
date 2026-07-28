import { EventEmitter } from "@angular/core";
import { TableRadioButtonFilterComponent } from "./table-radio-buton-filter.component";

describe("Table radio button filter component", () => {
  let filter: any;
  let selectedChange: EventEmitter<string>;
  let selected = "option1";
  let tableRadioButtonFilterComponent: TableRadioButtonFilterComponent;

  beforeEach(() => {
    tableRadioButtonFilterComponent = new TableRadioButtonFilterComponent();

    filter = jest.fn();
    selectedChange = {
      emit: jest.fn(),
    } as unknown as EventEmitter<string>;

    tableRadioButtonFilterComponent.selected = selected;
    tableRadioButtonFilterComponent.selectedChange = selectedChange;
    tableRadioButtonFilterComponent.filter = filter;
  });

  it("should filter and emit an event on select", () => {
    tableRadioButtonFilterComponent.onSelect();

    expect(filter).toHaveBeenCalledWith(selected);
    expect(selectedChange.emit).toHaveBeenCalledWith(selected);
  });

  it("should empty the selected and filter and emit and event on clear", () => {
    tableRadioButtonFilterComponent.clearSelectedStatuses();

    expect(tableRadioButtonFilterComponent.selected).toStrictEqual("");
    expect(filter).toHaveBeenCalledWith("");
    expect(selectedChange.emit).toHaveBeenCalledWith();
  });
});
