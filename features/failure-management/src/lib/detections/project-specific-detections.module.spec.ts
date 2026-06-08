import { TestBed } from "@angular/core/testing";
import { Router, RouterModule } from "@angular/router";
import { ProjectSpecificDetectionsModule } from "./project-specific-detections.module";
import { AuthorizationGuard } from "@mxflow/core/auth";
import { of } from "rxjs";

describe("ProjectSpecificDetectionsModule", () => {
  let router: Router;
  let mockAuthorizationGuard: Partial<AuthorizationGuard>;

  beforeEach(async () => {
    mockAuthorizationGuard = {
      canActivate: jest.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectSpecificDetectionsModule, RouterModule.forRoot([])],
      providers: [
        { provide: AuthorizationGuard, useValue: mockAuthorizationGuard },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it("should create the module", () => {
    expect(ProjectSpecificDetectionsModule).toBeTruthy();
  });

  describe("Configuration Regression Route", () => {
    it("should have a route for configuration regression view", () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const configRegressionRoute = parentRoute?.children?.find(
        (r) =>
          r.path === "regressions/configuration/:configuration-regression-id"
      );

      expect(configRegressionRoute).toBeTruthy();
      expect(configRegressionRoute?.canActivate).toContain(AuthorizationGuard);
    });

    it("should have correct authorization data for configuration regression route", () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const configRegressionRoute = parentRoute?.children?.find(
        (r) =>
          r.path === "regressions/configuration/:configuration-regression-id"
      );

      expect(configRegressionRoute?.data).toEqual({
        action: "read",
        package: "test",
        resource: "configuration_regression",
      });
    });

    it("should lazy load ConfigurationRegressionViewComponent", async () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const configRegressionRoute = parentRoute?.children?.find(
        (r) =>
          r.path === "regressions/configuration/:configuration-regression-id"
      );

      expect(configRegressionRoute?.loadComponent).toBeDefined();

      const loadedComponent = await configRegressionRoute?.loadComponent!();
      const { ConfigurationRegressionViewComponent } = await import(
        "../configuration-regression/configuration-regression-view/configuration-regression-view.component"
      );

      expect(loadedComponent).toBe(ConfigurationRegressionViewComponent);
    });
  });

  describe("Configuration Impact Route", () => {
    it("should have a route for configuration impact view", () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const configImpactRoute = parentRoute?.children?.find(
        (r) => r.path === "impacts/configuration/:configurationImpactId"
      );

      expect(configImpactRoute).toBeTruthy();
      expect(configImpactRoute?.canActivate).toContain(AuthorizationGuard);
    });

    it("should have correct authorization data for configuration impact route", () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const configImpactRoute = parentRoute?.children?.find(
        (r) => r.path === "impacts/configuration/:configurationImpactId"
      );

      expect(configImpactRoute?.data).toEqual({
        action: "read",
        package: "test",
        resource: "configuration_impact",
      });
    });

    it("should lazy load ConfigurationImpactViewComponent", async () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const configImpactRoute = parentRoute?.children?.find(
        (r) => r.path === "impacts/configuration/:configurationImpactId"
      );

      expect(configImpactRoute?.loadComponent).toBeDefined();

      const loadedComponent = await configImpactRoute?.loadComponent!();
      const { ConfigurationImpactViewComponent } = await import(
        "../configuration-impact/configuration-impact-view/configuration-impact-view.component"
      );

      expect(loadedComponent).toBe(ConfigurationImpactViewComponent);
    });
  });

  describe("Binary Impact Route", () => {
    it("should have a route for binary impact view", () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const binaryImpactRoute = parentRoute?.children?.find(
        (r) => r.path === "impacts/binary/:binary-impact-id"
      );

      expect(binaryImpactRoute).toBeTruthy();
      expect(binaryImpactRoute?.canActivate).toContain(AuthorizationGuard);
    });

    it("should have correct authorization data for binary impact route", () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const binaryImpactRoute = parentRoute?.children?.find(
        (r) => r.path === "impacts/binary/:binary-impact-id"
      );

      expect(binaryImpactRoute?.data).toEqual({
        action: "read",
        package: "test",
        resource: "binary_impact",
      });
    });

    it("should lazy load BinaryImpactViewComponent", async () => {
      const parentRoute = router.config.find((r) => r.path === "");
      const binaryImpactRoute = parentRoute?.children?.find(
        (r) => r.path === "impacts/binary/:binary-impact-id"
      );

      expect(binaryImpactRoute?.loadComponent).toBeDefined();

      const loadedComponent = await binaryImpactRoute?.loadComponent!();
      const { BinaryImpactViewComponent } = await import(
        "../binary-impact/binary-impact-view/binary-impact-view.component"
      );

      expect(loadedComponent).toBe(BinaryImpactViewComponent);
    });
  });
});
