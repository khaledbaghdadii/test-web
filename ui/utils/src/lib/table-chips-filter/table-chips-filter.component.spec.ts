import { TableChipsFilterComponent } from "./table-chips-filter.component";

describe("TableChipsFilterComponent", () => {
  let component: TableChipsFilterComponent;
  let filter: jest.Mock;
  beforeEach(() => {
    filter = jest.fn();
    component = new TableChipsFilterComponent();
    component.values = ["1", "potato"];
    component.filter = filter;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should search correctly", () => {
    const valueChangeSpy = jest.spyOn(component.valuesChange, "emit");

    component.values = ["1", "potato"];
    component.search();

    expect(filter).toHaveBeenCalledWith(["1", "potato"]);
    expect(valueChangeSpy).toHaveBeenCalledWith(["1", "potato"]);
  });

  it("should search correctly with empty value", () => {
    const valueChangeSpy = jest.spyOn(component.valuesChange, "emit");

    component.values = [];
    component.search();

    expect(filter).toHaveBeenCalledWith([]);
    expect(valueChangeSpy).toHaveBeenCalledWith([]);
  });
});
