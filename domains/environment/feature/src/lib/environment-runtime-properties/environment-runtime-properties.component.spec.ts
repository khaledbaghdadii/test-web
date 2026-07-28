import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { EnvironmentRuntimePropertiesComponent } from "./environment-runtime-properties.component";
import {
  RuntimePropertiesDocumentationService,
  RuntimePropertiesRequestType,
} from "@mxevolve/domains/environment/data-access";

describe("Environment Runtime Properties Component", () => {
  let fixture: ComponentFixture<EnvironmentRuntimePropertiesComponent>;
  let component: EnvironmentRuntimePropertiesComponent;

  const runtimePropertiesDocumentationServiceMock = {
    getRuntimePropertiesDocumentation: jest.fn(),
  };

  function buildRouteMock(projectId: string | null): ActivatedRoute {
    const paramMap = {
      get: jest.fn((key: string) => (key === "projectId" ? projectId : null)),
      has: jest.fn((key: string) => key === "projectId" && projectId !== null),
    };
    return {
      snapshot: {
        paramMap,
        pathFromRoot: [{ paramMap }],
      },
    } as unknown as ActivatedRoute;
  }

  function setupTestBed(routeMock: ActivatedRoute) {
    TestBed.configureTestingModule({
      imports: [EnvironmentRuntimePropertiesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        {
          provide: RuntimePropertiesDocumentationService,
          useValue: runtimePropertiesDocumentationServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnvironmentRuntimePropertiesComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not fetch properties automatically on init", () => {
    setupTestBed(buildRouteMock("proj-1"));

    fixture.detectChanges();

    expect(
      runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation
    ).not.toHaveBeenCalled();
    expect(component.properties()).toEqual([]);
  });

  it("fetches properties when a request type is selected", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "timeout",
            kind: "INTEGER",
            optional: true,
            deprecated: false,
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(
      runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation
    ).toHaveBeenCalledWith("proj-1", RuntimePropertiesRequestType.DEPLOYMENT);
    expect(component.properties()).toEqual([
      {
        name: "timeout",
        kind: "INTEGER",
        optional: true,
        deprecated: false,
      },
    ]);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it("builds tree nodes with nested object children", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "connection",
            kind: "OBJECT",
            optional: false,
            deprecated: false,
            children: [
              {
                name: "host",
                kind: "STRING",
                optional: false,
                deprecated: false,
              },
            ],
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(component.runtimePropertiesNodes()).toEqual([
      expect.objectContaining({
        label: "connection",
        leaf: false,
        data: expect.objectContaining({
          path: "connection",
          isListElement: false,
          deprecatedValue: "",
        }),
        children: [
          expect.objectContaining({
            label: "host",
            leaf: true,
            data: expect.objectContaining({
              path: "connection.host",
              isListElement: false,
              deprecatedValue: "",
            }),
          }),
        ],
      }),
    ]);
  });

  it("starts with allExpanded set to false and all nodes collapsed", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "connection",
            kind: "OBJECT",
            optional: false,
            deprecated: false,
            children: [
              {
                name: "host",
                kind: "STRING",
                optional: false,
                deprecated: false,
              },
            ],
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(component.allExpanded()).toBe(false);
    const [connectionNode] = component.runtimePropertiesNodes();
    expect(connectionNode.expanded).toBe(false);
    expect(connectionNode.children?.[0].expanded).toBe(false);
  });

  it("expands all nodes recursively when toggleExpandAll is called", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "connection",
            kind: "OBJECT",
            optional: false,
            deprecated: false,
            children: [
              {
                name: "host",
                kind: "STRING",
                optional: false,
                deprecated: false,
              },
            ],
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    component.toggleExpandAll();

    expect(component.allExpanded()).toBe(true);
    const [connectionNode] = component.runtimePropertiesNodes();
    expect(connectionNode.expanded).toBe(true);
    expect(connectionNode.children?.[0].expanded).toBe(true);
  });

  it("collapses all nodes recursively when toggleExpandAll is called twice", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "connection",
            kind: "OBJECT",
            optional: false,
            deprecated: false,
            children: [
              {
                name: "host",
                kind: "STRING",
                optional: false,
                deprecated: false,
              },
            ],
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    component.toggleExpandAll();
    component.toggleExpandAll();

    expect(component.allExpanded()).toBe(false);
    const [connectionNode] = component.runtimePropertiesNodes();
    expect(connectionNode.expanded).toBe(false);
    expect(connectionNode.children?.[0].expanded).toBe(false);
  });

  it("keeps the literal 'element' node for a LIST of OBJECT and tags it as a list element", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "packages",
            kind: "LIST",
            optional: false,
            deprecated: false,
            element: {
              name: "element",
              kind: "OBJECT",
              optional: false,
              deprecated: false,
              children: [
                {
                  name: "fileName",
                  kind: "STRING",
                  optional: false,
                  deprecated: false,
                },
              ],
            },
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(component.runtimePropertiesNodes()).toEqual([
      expect.objectContaining({
        label: "packages",
        leaf: false,
        data: expect.objectContaining({
          path: "packages[]",
          isListElement: false,
          deprecatedValue: "",
        }),
        children: [
          expect.objectContaining({
            label: "element",
            leaf: false,
            data: expect.objectContaining({
              path: "packages[]",
              kind: "OBJECT",
              isListElement: true,
              deprecatedValue: "",
            }),
            children: [
              expect.objectContaining({
                label: "fileName",
                leaf: true,
                data: expect.objectContaining({
                  path: "packages[].fileName",
                  isListElement: false,
                  deprecatedValue: "",
                }),
              }),
            ],
          }),
        ],
      }),
    ]);
  });

  it("keeps the literal 'element' node for a LIST of a primitive type and tags it as a list element", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "mxDbTypes",
            kind: "LIST",
            optional: false,
            deprecated: false,
            element: {
              name: "element",
              kind: "ENUM",
              optional: false,
              deprecated: false,
              allowedValues: ["financial", "reporting", "mlc"],
            },
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(component.runtimePropertiesNodes()).toEqual([
      expect.objectContaining({
        label: "mxDbTypes",
        leaf: false,
        data: expect.objectContaining({
          path: "mxDbTypes[]",
          isListElement: false,
          deprecatedValue: "",
        }),
        children: [
          expect.objectContaining({
            label: "element",
            leaf: true,
            data: expect.objectContaining({
              path: "mxDbTypes[]",
              kind: "ENUM",
              allowedValues: ["financial", "reporting", "mlc"],
              isListElement: true,
              deprecatedValue: "",
            }),
          }),
        ],
      }),
    ]);
  });

  it("builds a dotted path for a LIST nested inside an OBJECT", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "connection",
            kind: "OBJECT",
            optional: false,
            deprecated: false,
            children: [
              {
                name: "servers",
                kind: "LIST",
                optional: false,
                deprecated: false,
                element: {
                  name: "element",
                  kind: "OBJECT",
                  optional: false,
                  deprecated: false,
                  children: [
                    {
                      name: "host",
                      kind: "STRING",
                      optional: false,
                      deprecated: false,
                    },
                  ],
                },
              },
            ],
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(component.runtimePropertiesNodes()).toEqual([
      expect.objectContaining({
        label: "connection",
        data: expect.objectContaining({
          path: "connection",
          isListElement: false,
          deprecatedValue: "",
        }),
        children: [
          expect.objectContaining({
            label: "servers",
            data: expect.objectContaining({
              path: "connection.servers[]",
              isListElement: false,
              deprecatedValue: "",
            }),
            children: [
              expect.objectContaining({
                label: "element",
                data: expect.objectContaining({
                  path: "connection.servers[]",
                  isListElement: true,
                  deprecatedValue: "",
                }),
                children: [
                  expect.objectContaining({
                    label: "host",
                    data: expect.objectContaining({
                      path: "connection.servers[].host",
                      isListElement: false,
                      deprecatedValue: "",
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]);
  });

  it("should return deprecated value correctly", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "timeout",
            kind: "INTEGER",
            optional: true,
            deprecated: true,
            deprecationReason: "reason",
          },
        ],
      })
    );

    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(component.runtimePropertiesNodes()).toEqual([
      expect.objectContaining({
        label: "timeout",
        leaf: true,
        data: expect.objectContaining({
          path: "timeout",
          name: "timeout",
          isListElement: false,
          deprecatedValue: "deprecated",
          deprecated: true,
          deprecationReason: "reason",
        }),
      }),
    ]);
  });

  it("re-fetches when the request type changes", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({ requestType: "deployment", properties: [] })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);
    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.CLEANING,
    } as never);

    expect(
      runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation
    ).toHaveBeenCalledWith("proj-1", RuntimePropertiesRequestType.CLEANING);
  });

  it("sets an error message when the request fails", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      throwError(() => new Error("Server error"))
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);

    expect(component.errorMessage()).toBe("Server error");
    expect(component.isLoading()).toBe(false);
  });

  it("resets state when the selection is cleared", () => {
    runtimePropertiesDocumentationServiceMock.getRuntimePropertiesDocumentation.mockReturnValue(
      of({
        requestType: "deployment",
        properties: [
          {
            name: "timeout",
            kind: "INTEGER",
            optional: true,
            deprecated: false,
          },
        ],
      })
    );
    setupTestBed(buildRouteMock("proj-1"));
    fixture.detectChanges();

    component.onRequestTypeChange({
      value: RuntimePropertiesRequestType.DEPLOYMENT,
    } as never);
    component.onClear();

    expect(component.properties()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it("on destroy should complete the destroy$ observable", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
