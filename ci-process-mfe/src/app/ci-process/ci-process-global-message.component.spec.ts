import { concatMap, interval, lastValueFrom, merge, of, Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { CiProcessGlobalMessageComponent } from "./ci-process-global-message.component";

describe("CI Process Global Message Component Test", () => {
  const errorMessage = "some error message";

  let component: CiProcessGlobalMessageComponent;
  let store: any;

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(errorMessage)),
    };

    component = new CiProcessGlobalMessageComponent(store);
  });

  it("should set error message observable from the store", async () => {
    component.ngOnInit();

    let errorMessageValue = await lastValueFrom(component.errorMessage$);

    expect(errorMessageValue).toEqual(errorMessage);
  });

  it("should push a new value to the destroy observable on destroy", () => {
    component.destroy$ = {
      next: jest.fn(),
      complete: jest.fn(),
    } as unknown as Subject<any>;

    component.ngOnDestroy();

    expect(component.destroy$.next).toHaveBeenCalled();
  });

  it("should close destroy observable on destroy", () => {
    component.destroy$ = {
      next: jest.fn(),
      complete: jest.fn(),
    } as unknown as Subject<any>;

    component.ngOnDestroy();

    expect(component.destroy$.complete).toHaveBeenCalled();
  });

  it("should unsubscribe to observables that outlive the component", () => {
    let observable = interval(100).pipe(concatMap((value) => value.toString()));
    let subject = new Subject();

    let errorMessageObservable = merge(subject, observable);

    store = {
      select: jest.fn().mockReturnValueOnce(errorMessageObservable),
    } as unknown as Store;

    component = new CiProcessGlobalMessageComponent(store);

    component.ngOnInit();

    component.errorMessage$.subscribe();

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });
});
