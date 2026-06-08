import { Component, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable, Subject, takeUntil } from "rxjs";
import { getErrorMessage } from "./state/ci-process.selectors";
import { CiProcessActions } from "./state";

@Component({
  selector: "mxevolve-ci-process-global-message",
  templateUrl: "ci-process-global-message.component.html",
  standalone: false,
})
export class CiProcessGlobalMessageComponent implements OnInit, OnDestroy {
  destroy$ = new Subject();
  errorMessage$: Observable<string>;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.errorMessage$ = this.store
      .select(getErrorMessage)
      .pipe(takeUntil(this.destroy$));
  }

  closeErrorAlert() {
    this.store.dispatch(CiProcessActions.clearErrorMessage());
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
