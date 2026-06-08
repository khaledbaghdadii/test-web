import { DevelopmentApiModel } from "./development-api-model";

export interface DevelopmentsApiModel {
  totalPages: number;
  totalElements: number;
  size: number;
  content: DevelopmentApiModel[];
  empty: boolean;
  last: boolean;
}
