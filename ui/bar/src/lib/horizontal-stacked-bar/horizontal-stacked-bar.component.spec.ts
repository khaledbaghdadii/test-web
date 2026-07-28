import { HorizontalStackedBarComponent } from "./horizontal-stacked-bar.component";
import { BarColor, StackedBarItem } from "./stacked-bar-data.model";

describe("HorizontalStackedBarComponent", () => {
  let component: HorizontalStackedBarComponent;
  beforeEach(() => {
    component = new HorizontalStackedBarComponent();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set chart data labels and datasets correctly", () => {
    component.stackedBarItems = [
      {
        label: "Passed",
        color: BarColor.Green,
        value: 5,
      },
    ];

    component.initializeBarChart();

    expect(component.stackedBarItems.length).toEqual(1);
    expect(component.stackedBarItems[0].label).toEqual("Passed");
    expect(component.stackedBarItems[0].value).toStrictEqual(5);
  });

  it("should set the total value as the sum of the data", () => {
    component.stackedBarItems = getData();

    component.initializeBarChart();

    expect(component.total).toEqual(10);
  });

  function getData(): StackedBarItem[] {
    return [
      {
        label: "Passed",
        color: BarColor.Green,
        value: 5,
      },
      {
        label: "Underway",
        color: BarColor.Yellow,
        value: 3,
      },
      {
        label: "Failed",
        color: BarColor.Red,
        value: 2,
      },
    ];
  }
});
