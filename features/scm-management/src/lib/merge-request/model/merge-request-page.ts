import { MergeRequest } from "./merge-request";

export interface MergeRequestPage {
    content: MergeRequest[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    last: boolean;
  }