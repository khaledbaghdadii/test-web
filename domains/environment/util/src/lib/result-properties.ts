export interface ResultProperties {
  title: string;
  color: "success" | "secondary" | "info" | "warn" | "danger" | "contrast";
  icon: string;
  hasPopover: boolean;
  popoverTitle?: string;
}

export const allResultProperties: Record<string, ResultProperties> = {
  SUCCESS: {
    title: "Success",
    color: "success",
    icon: "check-circle",
    hasPopover: false,
  },
  FAILURE: {
    title: "Failure",
    color: "danger",
    icon: "close-circle",
    hasPopover: true,
    popoverTitle: "Failure",
  },
  TIMEOUT: {
    title: "Timeout",
    color: "warn",
    icon: "pause-circle",
    hasPopover: true,
    popoverTitle: "Timeout",
  },
  ABORTED: {
    title: "Aborted",
    color: "warn",
    icon: "close-circle",
    hasPopover: true,
    popoverTitle: "Aborted",
  },
  INVALID: {
    title: "Invalid",
    color: "warn",
    icon: "exclamation-circle",
    hasPopover: false,
  },
  UNFINISHED: {
    title: "N/A",
    color: "info",
    icon: "check-circle",
    hasPopover: false,
  },
};

export function getManagementRequestResultProperties(
  status: string,
  resultStatus?: string
): ResultProperties | undefined {
  if (status === "INVALID") {
    return allResultProperties["INVALID"];
  }
  if (resultStatus === null || resultStatus === undefined) {
    return allResultProperties["UNFINISHED"];
  }
  return allResultProperties[resultStatus];
}
