import { Environment } from "../../service/models/environment.model";

export interface EnvironmentsState {
  [environmentId: string]: EnvironmentState;
}

interface EnvironmentState {
  data?: Environment;
  error?: string;
}

export const initialState: EnvironmentsState = {};
