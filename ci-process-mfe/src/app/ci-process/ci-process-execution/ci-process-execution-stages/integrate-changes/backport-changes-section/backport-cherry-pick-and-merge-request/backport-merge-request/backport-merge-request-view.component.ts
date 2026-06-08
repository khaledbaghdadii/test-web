import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef,
} from "@angular/core";
import { Store } from "@ngrx/store";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { Subject, takeUntil } from "rxjs";
import { environment } from "../../../../../../../../environments/environment";
import { CiProcessActions } from "../../../../../../state";
import { MergeRequestViewComponentInstance } from "../../../../../common/merge-request-view-component-instance";

@Component({
  selector: "mxflow-backport-merge-request-view",
  templateUrl: "backport-merge-request-view.component.html",
})
export class BackportMergeRequestViewComponent implements OnInit, OnDestroy {
  destroy$ = new Subject();

  component: MergeRequestViewComponentInstance;
  @Input() mergeRequestId: string;

  constructor(
    private store: Store,
    private viewContainerRef: ViewContainerRef,
    private injectorService: RemoteComponentInjectorService
  ) {}

  ngOnInit(): void {
    this.loadModule()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (component) => {
          this.component = component;
          this.initializeMergeRequest(this.mergeRequestId);
        },
        error: (err) =>
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: err.message })
          ),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private initializeMergeRequest(mergeJobId: string) {
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
