import { Injectable, Signal, signal } from "@angular/core";
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  switchMap,
  catchError,
  finalize,
  EMPTY,
} from "rxjs";
import { MergeRequestPriority } from "../../merge-request/model/merge-request";
import { MergeRequestService } from "../../merge-request/merge-request.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";

@Injectable()
export class MergeRequestPrioritySelectorStateService {
  private readonly projectIdSubject = new BehaviorSubject<string>("");
  private readonly mergeRequestIdSubject = new BehaviorSubject<string>("");
  private readonly mergeRequestPrioritySubject =
    new Subject<MergeRequestPriority>();

  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoadingDataSignal: Signal<boolean> = toSignal(
    this.isLoadingSubject,
    {
      initialValue: false,
    }
  );

  readonly errorMessageSignal = signal<string>("");
  private successCallback: (() => void) | null = null;

  constructor(private readonly mergeRequestService: MergeRequestService) {
    this.updatePriorityValue();
  }

  private updatePriorityValue(): void {
    combineLatest([
      this.projectIdSubject,
      this.mergeRequestIdSubject,
      this.mergeRequestPrioritySubject,
    ])
      .pipe(
        switchMap(([projectId, mergeRequestId, priority]) => {
          this.isLoadingSubject.next(true);
          return this.updateMergeRequestPriority(
            projectId,
            mergeRequestId,
            priority
          ).pipe(
            catchError((error) => {
              this.setErrorMessageSignal(error.message);
              return EMPTY;
            }),
            finalize(() => {
              this.isLoadingSubject.next(false);
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        if (this.successCallback) {
          this.successCallback();
          this.successCallback = null;
        }
      });
  }

  private updateMergeRequestPriority(
    projectId: string,
    mergeRequestId: string,
    priority: MergeRequestPriority
  ) {
    return this.mergeRequestService.updateMergeRequestPriority(
      projectId,
      mergeRequestId,
      priority
    );
  }

  private setErrorMessageSignal(message: string): void {
    this.errorMessageSignal.set(message);
  }

  setProjectIdSubject(projectId: string): void {
    this.projectIdSubject.next(projectId);
  }

  setMergeRequestIdSubject(mergeRequestId: string): void {
    this.mergeRequestIdSubject.next(mergeRequestId);
  }

  setMergeRequestPrioritySubject(
    priority: MergeRequestPriority,
    onSuccess?: () => void
  ): void {
    if (onSuccess) {
      this.successCallback = onSuccess;
    }
    this.mergeRequestPrioritySubject.next(priority);
  }
}
