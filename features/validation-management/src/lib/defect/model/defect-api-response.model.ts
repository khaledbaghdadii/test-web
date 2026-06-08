export interface DefectApiResponse {
  id: string;
  link: string;
  title: string;
  description: string;
  developer: string;
  submissionDate: Date;
}
export interface DefectPageApiResponse {
  content: DefectApiResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
export interface FetchDefectApiResult {
  defects: DefectPageApiResponse;
  warningMessage?: string;
}
