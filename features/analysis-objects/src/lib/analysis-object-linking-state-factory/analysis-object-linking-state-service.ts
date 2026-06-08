import { BehaviorSubject } from "rxjs";
import { signal } from "@angular/core";

export abstract class AnalysisObjectLinkingStateService {
  readonly isLinking = signal(false);
  readonly isCreating = signal(false);
  readonly reset$ = new BehaviorSubject<undefined>(undefined);

  setIsLinking(isLinking: boolean) {
    this.isLinking.set(isLinking);
  }

  setIsCreating(isCreating: boolean) {
    this.isCreating.set(isCreating);
  }

  reset() {
    this.isLinking.set(false);
    this.isCreating.set(false);
    this.reset$.next(undefined);
  }
}
