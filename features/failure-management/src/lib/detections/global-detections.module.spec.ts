import { TestBed } from "@angular/core/testing";
import { Router, RouterModule } from "@angular/router";
import { GlobalDetectionsModule } from "./global-detections.module";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { of } from "rxjs";

describe("GlobalDetectionsModule", () => {
  let router: Router;
  let mockAuthorizationGuard: Partial<AuthorizationGuard>;

  beforeEach(async () => {
    mockAuthorizationGuard = {
      canActivate: jest.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [GlobalDetectionsModule, RouterModule.forRoot([])],
      providers: [
        { provide: AuthorizationGuard, useValue: mockAuthorizationGuard },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it("should create the module", () => {
    expect(GlobalDetectionsModule).toBeTruthy();
  });

  it("should have a route for binary regression view", () => {
    const parentRoute = router.config.find((r) => r.path === "");
    const binaryRegressionRoute = parentRoute?.children?.find(
      (r) => r.path === "regressions/binary/:binary-regression-id"
    );

    expect(binaryRegressionRoute).toBeTruthy();
    expect(binaryRegressionRoute?.canActivate).toContain(AuthorizationGuard);
  });

  it("should have correct authorization data for binary regression route", () => {
    const parentRoute = router.config.find((r) => r.path === "");
    const binaryRegressionRoute = parentRoute?.children?.find(
      (r) => r.path === "regressions/binary/:binary-regression-id"
    );

    expect(binaryRegressionRoute?.data).toEqual({
      action: "read",
      package: "test",
      resource: "binary_regression",
    });
  });

  it("should lazy load BinaryRegressionViewComponent", async () => {
    const parentRoute = router.config.find((r) => r.path === "");
    const binaryRegressionRoute = parentRoute?.children?.find(
      (r) => r.path === "regressions/binary/:binary-regression-id"
    );

    expect(binaryRegressionRoute?.loadComponent).toBeDefined();

    const loadedComponent = await binaryRegressionRoute?.loadComponent!();
    const { BinaryRegressionViewComponent } = await import(
      "../binary-regression/binary-regression-view/binary-regression-view.component"
    );

    expect(loadedComponent).toBe(BinaryRegressionViewComponent);
  });
});
