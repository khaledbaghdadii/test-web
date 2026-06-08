export interface BinaryRegression {
  id: string;
  title: string;
  description: string;
  defect: Defect;
  fix: string;
  mxVersion: string;
  owner?: string;
  projectId?: string;
  incidentId?: string;
  creationDate: Date;
}

export class Defect {
  id: string;
  link: string;
}
