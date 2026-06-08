import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef,
} from "@angular/core";
import { environment } from "../../../../../../../environments/environment";
import { Store } from "@ngrx/store";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { skipWhile, Subject, takeUntil } from "rxjs";
import { CiProcessActions } from "../../../../../state";
import { MergeRequestViewComponentInstance } from "../../../../common/merge-request-view-component-instance";

@Component({
  selector: "mxflow-merge-request-view",
  templateUrl: "merge-request-view.component.html",
})
export class MergeRequestViewComponent implements OnInit, OnDestroy {
  destroy$ = new Subject();

  @Input() mergeJobId: string;

  component: MergeRequestViewComponentInstance;

  constructor(
    private store: Store,
    private viewContainerRef: ViewContainerRef,
    private injectorService: RemoteComponentInjectorService
  ) {}

  ngOnInit(): void {
    this.loadModule()
      .pipe(
        skipWhile(() => !this.mergeJobId),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (component) => {
          this.component = component;
          this.initializeMergeRequest(this.mergeJobId);
        },
        error: (error) => {
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: error.message })
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  initializeMergeRequest(mergeJobId: string) {
    this.component.initialize(mergeJobId);
  }

  private loadModule() {
    return this.injectorService.loadComponent({
      mfeUrl: environment.scmMfeUrl,
      componentName: "MergeRequestViewComponent",
      componentExposedPath: "./MergeRequestView",
      moduleName: "MergeRequestViewModule",
      placeHolderComponent: this.viewContainerRef,
    });
  }
}
