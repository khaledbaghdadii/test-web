import { BusinessProcessOfficialStatus } from "./business-process-official-status";

interface BusinessProcessOfficialStatusFilter {
  text: string;
  value: BusinessProcessOfficialStatus;
}

export const officialityFilters: BusinessProcessOfficialStatusFilter[] = [
  { text: "Official", value: BusinessProcessOfficialStatus.OFFICIAL },
  { text: "Unofficial", value: BusinessProcessOfficialStatus.UNOFFICIAL },
  { text: "N/A", value: BusinessProcessOfficialStatus.NA },
];
