export interface Defect {
  id: string;
  link: string;
  title: string;
  description: string;
  developer: string;
  submissionDate: Date;
}
export interface DefectPage {
  content: Defect[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
export interface FetchDefectResult {
  defects: DefectPage;
  warningMessage?: string;
}
