import { Subject } from "rxjs";

export interface ScenarioExecutionsTableComponentInstance {
  initialize(config: {
    contextId: string;
    subContextId: string;
    showRepush: boolean;
    showBulkRepush: boolean;
  }): void;
  errorEventEmitter: Subject<string>;
  scenarioRepushed: Subject<void>;
}
