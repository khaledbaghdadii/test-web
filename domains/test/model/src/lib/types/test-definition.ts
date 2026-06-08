import { TestSelection } from "./test-selection";

export interface TimeoutDuration {
  days: number;
  hours: number;
  minutes: number;
}

export interface TestDefinition {
  id: string;
  name: string;
  projectId: string;
  repoId: string;
  path: string;
  timeoutDuration: TimeoutDuration;
  testSelections: TestSelection[];
  description: string;
}
