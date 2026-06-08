import { Incident } from "./incident.model";

export interface IncidentPage {
    content: Incident[]; 
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    last: boolean;
}