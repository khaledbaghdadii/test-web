import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { Store } from "@ngrx/store";
import { ViewContainerRef } from "@angular/core";
import { of, Subject, throwError } from "rxjs";
import { MergeRequestViewComponent } from "./merge-request-view.component";
import { environment } from "../../../../../../../environments/environment";
import { CiProcessActions } from "../../../../../state";

describe("MergeRequestViewComponent", () => {
  const MERGE_JOB_ID = "MERGE_JOB_ID";
  const ERROR_MESSAGE = "ERROR_MESSAGE";

  let remoteComponent: any;
  let remoteModuleInjector: RemoteComponentInjectorService;
  let store: Store;
  let viewContainerRef: ViewContainerRef;

  let mergeRequestViewComponent: MergeRequestViewComponent;

  beforeEach(() => {
    remoteComponent = {
      initialize: jest.fn(),
    };
    remoteModuleInjector = {
      loadComponent: jest.fn(() => of(remoteComponent)),
    } as unknown as RemoteComponentInjectorService;
    store = {
      dispatch: jest.fn(),
    } as unknown as Store;
    viewContainerRef = {} as unknown as ViewContainerRef;

    mergeRequestViewComponent = new MergeRequestViewComponent(
      store,
      viewContainerRef,
      remoteModuleInjector
    );
    mergeRequestViewComponent.mergeJobId = MERGE_JOB_ID;
  });

  it("should load remote component on init", () => {
    mergeRequestViewComponent.ngOnInit();

    expect(remoteModuleInjector.loadComponent).toHaveBeenCalledWith({
      mfeUrl: environment.scmMfeUrl,
      componentName: "MergeRequestViewComponent",
      componentExposedPath: "./MergeRequestView",
      moduleName: "MergeRequestViewModule",
      placeHolderComponent: viewContainerRef,
    });
    expect(mergeRequestViewComponent.component).toStrictEqual(remoteComponent);
  });

  it("should initialize component correctly on init", () => {
    mergeRequestViewComponent.ngOnInit();

    expect(remoteComponent.initialize).toHaveBeenCalledTimes(1);
    expect(remoteComponent.initialize).toHaveBeenCalledWith(MERGE_JOB_ID);
  });

  it("should dispatch error if remote injector threw an error", () => {
    remoteModuleInjector = {
      loadComponent: jest.fn(() => throwError(() => new Error(ERROR_MESSAGE))),
    } as unknown as RemoteComponentInjectorService;
    mergeRequestViewComponent = new MergeRequestViewComponent(
      store,
      viewContainerRef,
      remoteModuleInjector
    );
    mergeRequestViewComponent.mergeJobId = MERGE_JOB_ID;

    mergeRequestViewComponent.ngOnInit();

    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessActions.updateErrorMessage({ message: ERROR_MESSAGE })
    );
  });

  it("should initialize remote component with merge job id on initialize", () => {
    mergeRequestViewComponent.component = remoteComponent;

    mergeRequestViewComponent.initializeMergeRequest(MERGE_JOB_ID);

    expect(remoteComponent.initialize).toHaveBeenCalledWith(MERGE_JOB_ID);
  });

  it("should push a new value to the destroy observable on destroy", () => {
    mergeRequestViewComponent.destroy$ = {
      next: jest.fn(),
      complete: jest.fn(),
    } as unknown as Subject<any>;

    mergeRequestViewComponent.ngOnDestroy();

    expect(mergeRequestViewComponent.destroy$.next).toHaveBeenCalled();
  });

  it("should close destroy observable on destroy", () => {
    mergeRequestViewComponent.destroy$ = {
      next: jest.fn(),
      complete: jest.fn(),
    } as unknown as Subject<any>;

    mergeRequestViewComponent.ngOnDestroy();

    expect(mergeRequestViewComponent.destroy$.complete).toHaveBeenCalled();
  });
});
