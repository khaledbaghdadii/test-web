import { TestBed } from "@angular/core/testing";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Subject } from "rxjs";
import { v4 as uuidv4 } from "uuid";

interface MockRouteNode {
  snapshot: { params: Record<string, string> };
  firstChild: MockRouteNode | null;
}

describe("ProjectIdRouteParamsResolverService", () => {
  let service: ProjectIdRouteParamsResolverService;
  let mockActivatedRoute: { root: MockRouteNode };
  let routerEvents$: Subject<NavigationEnd>;

  beforeEach(() => {
    mockActivatedRoute = {
      root: {
        snapshot: { params: {} },
        firstChild: null,
      },
    };
    routerEvents$ = new Subject();

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { events: routerEvents$ } },
      ],
    });
    service = TestBed.inject(ProjectIdRouteParamsResolverService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should resolve projectId from route parameters", () => {
    const expectedProjectId = uuidv4();
    mockActivatedRoute.root.snapshot.params = { projectId: expectedProjectId };

    const projectId = service.resolve();
    expect(projectId).toBe(expectedProjectId);
  });

  it("should resolve projectId from nested route parameters", () => {
    const expectedProjectId = uuidv4();
    mockActivatedRoute.root.firstChild = {
      snapshot: { params: { projectId: expectedProjectId } },
      firstChild: null,
    };

    const projectId = service.resolve();
    expect(projectId).toBe(expectedProjectId);
  });

  it("should resolve projectId from two levels deep route parameters", () => {
    const expectedProjectId = uuidv4();
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

  it("should expose the current projectId as a signal on navigation end", () => {
    const expectedProjectId = uuidv4();
    mockActivatedRoute.root.snapshot.params = { projectId: expectedProjectId };

    routerEvents$.next(new NavigationEnd(1, "/", "/"));

    expect(service.projectId()).toBe(expectedProjectId);
  });

  it("should update the projectId signal when the project changes", () => {
    const firstProjectId = uuidv4();
    const secondProjectId = uuidv4();
    mockActivatedRoute.root.snapshot.params = { projectId: firstProjectId };
    routerEvents$.next(new NavigationEnd(1, "/", "/"));

    mockActivatedRoute.root.snapshot.params = { projectId: secondProjectId };
    routerEvents$.next(new NavigationEnd(2, "/", "/"));

    expect(service.projectId()).toBe(secondProjectId);
  });
});
