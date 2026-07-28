import { agGridCompareDates } from "@mxflow/ui/utils";

describe("AG grid date filter comparator test", () => {
  it("should return -1 if the cell date is smaller than the filter date", () => {
    const filterDate = new Date("2023-10-01T00:00:00");
    const cellDate = "2023-09-30T00:00:00";

    const result = agGridCompareDates(filterDate, cellDate);

    expect(result).toStrictEqual(-1);
  });

  it("should return 1 if the cell date is bigger than the filter date", () => {
    const filterDate = new Date("2023-10-01T00:00:00");
    const cellDate = "2023-10-02T00:00:00";

    const result = agGridCompareDates(filterDate, cellDate);

    expect(result).toStrictEqual(1);
  });

  it("should return 0 for equal dates", () => {
    const filterDate = new Date("2023-10-01T00:00:00");
    const cellDate = "2023-10-01T00:00:00";

    const result = agGridCompareDates(filterDate, cellDate);

    expect(result).toStrictEqual(0);
  });

  it("should return 1 if the dates are equal but the time is not", () => {
    const filterDate = new Date("2023-10-01T00:00:00");
    const cellDate = "2023-10-01T01:00:00";

    const result = agGridCompareDates(filterDate, cellDate);

    expect(result).toStrictEqual(0);
  });
});
