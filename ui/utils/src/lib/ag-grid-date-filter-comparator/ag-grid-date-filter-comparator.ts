import { formatDate } from "@angular/common";

export function agGridCompareDates(
  filterDateAtMidnight: Date,
  cellDate: string
) {
  const filterFormattedDate = formatDate(
    filterDateAtMidnight,
    "yyyy-MM-dd",
    "en_US"
  );
  const cellFormattedDate = formatDate(cellDate, "yyyy-MM-dd", "en_US");

  if (cellFormattedDate < filterFormattedDate) {
    return -1;
  } else if (cellFormattedDate > filterFormattedDate) {
    return 1;
  } else {
    return 0;
  }
}
