import { ScenarioExecutionRepushPayload } from "./scenario-repush-payload";

export interface SingleRepushPayload extends ScenarioExecutionRepushPayload {
  scenarioExecutionId: string;
}
