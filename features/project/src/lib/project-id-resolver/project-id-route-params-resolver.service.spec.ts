import { TestBed } from "@angular/core/testing";
import {
  ProjectIdGuardInputResolver,
  ProjectIdRouteParamsResolverService,
} from "@mxflow/features/project";
import { ActivatedRoute } from "@angular/router";
import { v4 as uuidv4 } from "uuid";

describe("ProjectIdRouteParamsResolverService", () => {
  let service: ProjectIdRouteParamsResolverService;
  let mockActivatedRoute: any;

  beforeEach(() => {
    mockActivatedRoute = {
      root: {
        snapshot: { params: {} },
        firstChild: null,
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    });
    service = TestBed.inject(ProjectIdRouteParamsResolverService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should resolve projectId from route parameters", () => {
    let expectedProjectId = uuidv4();
    mockActivatedRoute.root.snapshot.params = { projectId: expectedProjectId };

    const projectId = service.resolve();
    expect(projectId).toBe(expectedProjectId);
  });

  it("should resolve projectId from nested route parameters", () => {
    let expectedProjectId = uuidv4();
    mockActivatedRoute.root.firstChild = {
      snapshot: { params: { projectId: expectedProjectId } },
      firstChild: null,
    };

    const projectId = service.resolve();
    expect(projectId).toBe(expectedProjectId);
  });

  it("should resolve projectId from two levels deep route parameters", () => {
    let expectedProjectId = uuidv4();
    mockActivatedRoute.root.firstChild = {
      snapshot: { params: {} },
      firstChild: {
        snapshot: { params: { projectId: expectedProjectId } },
        firstChild: null,
      },
    };

    const projectId = service.resolve();
    expect(projectId).toBe(expectedProjectId);
  });

  it("should throw an error if no projectId is found", () => {
    mockActivatedRoute.root.snapshot.params = {};
    mockActivatedRoute.root.firstChild = null;
    expect(() => service.resolve()).toThrow("No Project Found");
  });
});
