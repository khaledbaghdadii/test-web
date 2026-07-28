import { TableSearchCheckboxFilterComponent } from "@mxflow/ui/utils";

describe("TableSearchCheckboxFilterComponent", () => {
  let filter: any;
  let component: TableSearchCheckboxFilterComponent;

  beforeEach(() => {
    filter = jest.fn();
    component = new TableSearchCheckboxFilterComponent();
    component.filter = filter;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit selectedChange event and filter when onClear is called", () => {
    const selectedChangeEventSpy = jest.spyOn(component.selectedChange, "emit");

    component.onClear();

    expect(selectedChangeEventSpy).toHaveBeenCalledWith([]);
    expect(component.selected).toEqual([]);
    expect(filter).toHaveBeenCalledWith([]);
  });

  it("should emit selectedChange event and filter when onProjectSelected is called", () => {
    const selectedChangeEventSpy = jest.spyOn(component.selectedChange, "emit");
    component.selected = ["projectId"];

    component.onProjectSelected();

    expect(selectedChangeEventSpy).toHaveBeenCalledWith(["projectId"]);
    expect(filter).toHaveBeenCalledWith(["projectId"]);
  });
});
