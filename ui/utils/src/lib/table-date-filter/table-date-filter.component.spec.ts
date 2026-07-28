import { TableDateFilterComponent } from "./table-date-filter.component";

describe("Data Filter NgZorro Component test", () => {
  let filter: any;

  let tableDateFilterComponent: TableDateFilterComponent;

  beforeEach(() => {
    filter = jest.fn();

    tableDateFilterComponent = new TableDateFilterComponent();

    tableDateFilterComponent.filter = filter;
  });

  it("should reset the fields on reset and filter", () => {
    tableDateFilterComponent.selectedRange = [{} as Date];

    tableDateFilterComponent.reset();

    expect(tableDateFilterComponent.selectedRange).toStrictEqual([]);
    expect(filter).toHaveBeenCalledWith([]);
  });

  it("should filter with an array of (from date) and (to date rounded to the next day) without time on search", () => {
    let fromDate: Date = new Date(2023, 1, 1, 1, 1, 1);
    let toDate: Date = new Date();

    tableDateFilterComponent.selectedRange = [fromDate, toDate];

    tableDateFilterComponent.selectRange();

    const toDateNextDay = new Date(toDate);
    toDateNextDay.setDate(toDateNextDay.getDate() + 1);

    expect(filter).toHaveBeenCalledWith([
      new Date(fromDate.toDateString()).toISOString(),
      new Date(toDateNextDay.toDateString()).toISOString(),
    ]);
  });

  it("should filter with a range of today date on set date to today", () => {
    tableDateFilterComponent.setDateToToday();

    const todayDate = new Date();
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    expect(filter).toHaveBeenCalledWith([
      new Date(todayDate.toDateString()).toISOString(),
      new Date(nextDay.toDateString()).toISOString(),
    ]);
  });

  it("should filter with a range of past week on set date to past week", () => {
    tableDateFilterComponent.setDateToPastWeek();

    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const pastWeek = new Date(new Date().getTime() - oneWeek);

    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    expect(filter).toHaveBeenCalledWith([
      new Date(pastWeek.toDateString()).toISOString(),
      new Date(nextDay.toDateString()).toISOString(),
    ]);
  });
});
