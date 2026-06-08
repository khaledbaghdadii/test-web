import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { BusinessProcessExecutionService } from "@mxflow/features/business-process";
import { Observable, of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { executionExistsGuard } from "./execution-exists-guard";

describe("executionExistsGuard", () => {
  let service: BusinessProcessExecutionService;
  let router: Router;

  const mockSnapshot = {
    paramMap: new Map([
      ["projectId", "project-id"],
      ["executionId", "execution-id"],
    ]),
  } as unknown as ActivatedRouteSnapshot;

  beforeEach(() => {
    let businessProcessExecutionMock = {
      businessProcessExists: jest.fn(),
    };

    let routerMock = {
      createUrlTree: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: BusinessProcessExecutionService,
          useValue: businessProcessExecutionMock,
        },
        {
          provide: Router,
          useValue: routerMock,
        },
      ],
    });

    service = TestBed.inject(BusinessProcessExecutionService);
    router = TestBed.inject(Router);
  });

  it("should direct to execution page when execution exists", () => {
    (service.businessProcessExists as jest.Mock).mockReturnValueOnce(
      of({ id: "execution-id" })
    );

    let context = TestBed.runInInjectionContext(
      booleanExecutionGuardWrap(mockSnapshot)
    );

    let result = null;
    context.subscribe((value) => (result = value));
    expect(result).toBe(true);
  });

  it("should redirect to not-found when execution does not exist", () => {
    (service.businessProcessExists as jest.Mock).mockReturnValueOnce(
      throwError(() => {
        return { status: 404, message: "error" };
      })
    );

    let context = TestBed.runInInjectionContext(
      urlTreeExecutionGuardWrap(mockSnapshot)
    );

    let result = null;
    context.subscribe((value) => (result = value));

    expect(result).toEqual(router.createUrlTree(["/not-found"]));
    expect(router.createUrlTree).toHaveBeenCalledWith(["/not-found"]);
  });

  it("should not redirect if error status is not 404 ", () => {
    (service.businessProcessExists as jest.Mock).mockReturnValueOnce(
      throwError(() => {
        return { status: 500, message: "error" };
      })
    );

    let context = TestBed.runInInjectionContext(
      urlTreeExecutionGuardWrap(mockSnapshot)
    );

    let result = null;
    context.subscribe((value) => (result = value));

    expect(result).toEqual(router.createUrlTree(["/not-found"]));
    expect(router.createUrlTree).toHaveBeenCalledWith(["/not-found"]);
  });
});

function booleanExecutionGuardWrap(mockSnapshot: ActivatedRouteSnapshot) {
  return () => {
    return executionExistsGuard(
      mockSnapshot,
      {} as RouterStateSnapshot
    ) as Observable<boolean>;
  };
}

function urlTreeExecutionGuardWrap(mockSnapshot: ActivatedRouteSnapshot) {
  return () => {
    return executionExistsGuard(
      mockSnapshot,
      {} as RouterStateSnapshot
    ) as Observable<UrlTree>;
  };
}
