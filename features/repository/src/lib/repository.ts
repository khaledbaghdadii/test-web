export interface Repository {
  id: string;
  name: string;
  url: string;
  credentialsId: string;
  label: string;
  defaultBranch: string;
}

export const repositoryLabels = {
  TEST_REPOSITORY: "test",
  CONFIG_REPOSITORY: "config",
};
