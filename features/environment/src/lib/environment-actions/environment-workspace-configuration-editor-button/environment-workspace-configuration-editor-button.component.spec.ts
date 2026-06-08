import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EnvironmentWorkspaceConfigurationEditorButtonComponent } from "./environment-workspace-configuration-editor-button.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { interval, merge, of, Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { Router } from "@angular/router";
import { Environment, EnvironmentStatus } from "@mxflow/features/environment";
import { ProjectUrlPipe } from "@mxflow/features/project";

describe("EnvironmentWorkspaceConfigurationEditorButtonComponent", () => {
  let component: EnvironmentWorkspaceConfigurationEditorButtonComponent;
  let fixture: ComponentFixture<EnvironmentWorkspaceConfigurationEditorButtonComponent>;
  let fakeStore: jest.Mocked<
    Store<{ id?: string; status?: EnvironmentStatus }>
  >;
  let fakeRouter: jest.Mocked<Router>;
  let fakeProjectUrlPipe: jest.Mocked<ProjectUrlPipe>;

  beforeEach(async () => {
    fakeStore = {
      select: jest.fn().mockReturnValue(of(undefined)),
    } as unknown as jest.Mocked<
      Store<{ id?: string; status?: EnvironmentStatus }>
    >;

    fakeRouter = {
      createUrlTree: jest.fn(),
      serializeUrl: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    fakeProjectUrlPipe = {
      transform: jest
        .fn()
        .mockImplementation((projectId: string) => `/app/${projectId}`),
    } as unknown as jest.Mocked<ProjectUrlPipe>;

    await TestBed.configureTestingModule({
      imports: [EnvironmentWorkspaceConfigurationEditorButtonComponent],
      providers: [
        { provide: Store, useValue: fakeStore },
        { provide: Router, useValue: fakeRouter },
        { provide: ProjectUrlPipe, useValue: fakeProjectUrlPipe },
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      EnvironmentWorkspaceConfigurationEditorButtonComponent
    );
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set disabled to false when environment status is READY", () => {
    fakeStore.select = jest
      .fn()
      .mockReturnValue(of(createMockEnvironment(EnvironmentStatus.READY)));

    component.projectId = "project";
    component.environmentId = "env1";

    component.ngOnInit();

    expect(component.disabled).toBe(false);
    expect(component.displayToolTip).toBeUndefined();
  });

  it("should set displayToolTip when environment is not READY", () => {
    fakeStore.select = jest
      .fn()
      .mockReturnValue(of(createMockEnvironment(EnvironmentStatus.CLEANED)));

    component.projectId = "project";
    component.environmentId = "env1";

    component.ngOnInit();

    expect(component.disabled).toBe(true);
    expect(component.displayToolTip).toBe(
      "Environment is not in a ready state."
    );
  });

  it("openConfigurationEditor should not call window.open when inputs are missing", () => {
    jest.spyOn(window, "open").mockImplementation(() => null);

    component.projectId = "";
    component.environmentId = "";

    component.openConfigurationEditor();

    expect(window.open).not.toHaveBeenCalled();
  });

  it("openConfigurationEditor should open a new tab with the correct URL containing environmentId and configuration-editor", () => {
    component.projectId = "project";
    component.environmentId = "env1";
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    component.openConfigurationEditor();
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("/environments/env1/configuration-editor"),
      "_blank"
    );
    openSpy.mockRestore();
  });

  it("ngOnDestroy should unsubscribe from store select subscription", () => {
    const subject = new Subject<void>();
    const long = interval(100);
    fakeStore.select = jest.fn().mockReturnValue(merge(subject, long));

    component.projectId = "project";
    component.environmentId = "env1";

    component.ngOnInit();
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  function createMockEnvironment(
    status: EnvironmentStatus = EnvironmentStatus.READY
  ): Environment {
    return {
      id: "env1",
      projectId: "project",
      status,
      configurationIdentifier: {},
      outputsDirectoryUri: "",
      primaryApplicative: {
        allocation: {},
        directory: "",
      },
      secondaryApplicatives: [],
      tests: [],
      bundles: [],
      clients: [],
      maintenance: { full: true },
      createdOn: "",
      createdBy: "",
    };
  }
});
