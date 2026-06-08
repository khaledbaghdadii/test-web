import { Injectable } from "@angular/core";
import scenarioExecutionRejectionReasonMap from "./scenario-execution-rejection-reasons-map";

@Injectable()
export class RejectionReasonMapperService {
  map(reasons: string[]): string {
    if (!reasons || reasons.length == 0) {
      return "";
    }
    return reasons
      .map(
        (rejectionReason) =>
          scenarioExecutionRejectionReasonMap[rejectionReason] ?? ""
      )
      .join("");
  }
}
