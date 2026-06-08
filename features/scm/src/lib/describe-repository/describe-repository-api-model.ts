export interface DescribeRepositoryApiModel {
  nodes: NodeApiModel[];
}

export interface NodeApiModel {
  name: string;
  children: NodeApiModel[] | undefined;
  isDirectory: boolean;
}
