import { MergeRequestApiResponse } from "./merge-request-api-response";

export interface MergeRequestApiPage {
    content: MergeRequestApiResponse[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    last: boolean;
  }