import { IncidentApiModel } from "./incident-api-model";

export interface IncidentApiPage {
    incidents: {
        content: IncidentApiModel[];
        totalPages: number;
        totalElements: number;
        size: number;
        number: number;
        last: boolean;
    }
}
  