import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { Store } from "@ngrx/store";
import { ViewContainerRef } from "@angular/core";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { BackportMergeRequestViewComponent } from "./backport-merge-request-view.component";
import { CiProcessActions } from "../../../../../../state";
import { environment } from "../../../../../../../../environments/environment";

describe("MergeRequestViewComponent", () => {
  const ERROR_MESSAGE = "ERROR_MESSAGE";
  const latestMergeJobId = "latestMergeJobId";

  let remoteComponent: any;
  let remoteModuleInjector: RemoteComponentInjectorService;
  let store: Store;
  let viewContainerRef: ViewContainerRef;

  let backportMergeRequestViewComponent: BackportMergeRequestViewComponent;

  beforeEach(() => {
    store = {
      dispatch: jest.fn(),
    } as unknown as Store;

    remoteComponent = {
      initialize: jest.fn(),
    };

    remoteModuleInjector = {
      loadComponent: jest.fn(() => of(remoteComponent)),
    } as unknown as RemoteComponentInjectorService;

    viewContainerRef = {} as unknown as ViewContainerRef;

    backportMergeRequestViewComponent = new BackportMergeRequestViewComponent(
      store,
      viewContainerRef,
      remoteModuleInjector
    );

    initializeInputs();
  });

  it("should load remote component on init", () => {
    backportMergeRequestViewComponent.ngOnInit();

    expect(remoteModuleInjector.loadComponent).toHaveBeenCalledWith({
      mfeUrl: environment.scmMfeUrl,
      componentName: "MergeRequestViewComponent",
      componentExposedPath: "./MergeRequestView",
      moduleName: "MergeRequestViewModule",
      placeHolderComponent: viewContainerRef,
    });

    expect(backportMergeRequestViewComponent.component).toStrictEqual(
      remoteComponent
    );
  });

  it("should initialize component correctly on init", () => {
    backportMergeRequestViewComponent.ngOnInit();

    expect(remoteComponent.initialize).toHaveBeenCalledTimes(1);
    expect(remoteComponent.initialize).toHaveBeenCalledWith(latestMergeJobId);
  });

  it("should dispatch error if remote injector threw an error", () => {
    remoteModuleInjector = {
      loadComponent: jest.fn(() => throwError(() => new Error(ERROR_MESSAGE))),
    } as unknown as RemoteComponentInjectorService;

    backportMergeRequestViewComponent = new BackportMergeRequestViewComponent(
      store,
      viewContainerRef,
      remoteModuleInjector
    );

    initializeInputs();
    backportMergeRequestViewComponent.ngOnInit();

    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessActions.updateErrorMessage({ message: ERROR_MESSAGE })
    );
  });

  it("should push a new value to the destroy observable on destroy", () => {
    backportMergeRequestViewComponent.destroy$ = {
      next: jest.fn(),
      complete: jest.fn(),
    } as unknown as Subject<any>;

    backportMergeRequestViewComponent.ngOnDestroy();

    expect(backportMergeRequestViewComponent.destroy$.next).toHaveBeenCalled();
  });

  it("should close destroy observable on destroy", () => {
    backportMergeRequestViewComponent.destroy$ = {
      next: jest.fn(),
      complete: jest.fn(),
    } as unknown as Subject<any>;

    backportMergeRequestViewComponent.ngOnDestroy();

    expect(
      backportMergeRequestViewComponent.destroy$.complete
    ).toHaveBeenCalled();
  });

  it("should unsubscribe to observables that outlive the component", () => {
    let observable = interval(100).pipe(concatMap((value) => value.toString()));
    let subject = new Subject();

    let executionObservable = merge(subject, observable);

    remoteModuleInjector = {
      loadComponent: jest.fn().mockReturnValueOnce(executionObservable),
    } as unknown as RemoteComponentInjectorService;

    backportMergeRequestViewComponent = new BackportMergeRequestViewComponent(
      store,
      viewContainerRef,
      remoteModuleInjector
    );

    initializeInputs();

    backportMergeRequestViewComponent.ngOnInit();

    expect(subject.observed).toBe(true);

    backportMergeRequestViewComponent.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });

  function initializeInputs() {
    backportMergeRequestViewComponent.mergeRequestId = "latestMergeJobId";
  }
});
