import { CopyPackageDetailsButtonComponent } from "./copy-package-details-button.component";
import { MessageService } from "primeng/api";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Overlay } from "@angular/cdk/overlay";
import { ClipboardService } from "../../service/clipboard/clipboard.service";
import { concatMap, interval, merge, Observable, of, Subject } from "rxjs";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { SimpleChanges } from "@angular/core";
import { Environment } from "../../service/models/environment.model";
import { EnvironmentStatus } from "../../environment-status/environment-status";
import { AuthorizationService } from "@mxflow/core/auth";
import { Store } from "@ngrx/store";
import { EnvironmentsState } from "../../store/environment/environments.state";

const OUTPUTS_REPOSITORY_URL = "outputsDirectoryUri";
const projectId = "projectId";
const environmentId = "environmentId";

describe("Copy package details button", () => {
  let clipboardService: ClipboardService;
  let messageService: MessageService;
  let component: CopyPackageDetailsButtonComponent;
  let fixture: ComponentFixture<CopyPackageDetailsButtonComponent>;
  let authorizationService: AuthorizationService;
  let store: Store<EnvironmentsState>;

  const environment: Environment = {
    id: "environmentId",
    outputsDirectoryUri: "outputsDirectoryUri",
    status: EnvironmentStatus.READY,
    configurationIdentifier: {
      branch: "main",
      revision: "main",
    },
    primaryApplicative: {
      directory: "appDirDirectory",
      allocation: {
        ports: {
          start: 100,
          end: 150,
        },
        machine: {
          name: "applicationMachineHostname",
        },
      },
    },
    bundles: [
      {
        id: "bundle-1",
        version: "1.0.0",
        branch: "main",
        changelist: "123",
      },
    ],
    tests: [],
    databases: [],
    clients: [],
    createdOn: "date",
    createdBy: "",
    maintenance: {
      full: true,
    },
    projectId: "",
  };

  beforeEach(() => {
    messageService = {
      add: jest.fn(),
    } as unknown as MessageService;

    authorizationService = {
      isAuthorized: jest.fn(() => of(true)),
    } as unknown as AuthorizationService;

    store = {
      select: jest.fn(),
    } as unknown as Store<EnvironmentsState>;

    TestBed.configureTestingModule({
      declarations: [CopyPackageDetailsButtonComponent],
      imports: [ButtonModule, TooltipModule],
      providers: [
        Overlay,
        { provide: MessageService, useValue: messageService },
        { provide: ClipboardService, useValue: clipboardService },
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: Store<EnvironmentsState>, useValue: store },
      ],
    });

    fixture = TestBed.createComponent(CopyPackageDetailsButtonComponent);

    component = fixture.componentInstance;
    component.outputsDirectoryUri = OUTPUTS_REPOSITORY_URL;

    clipboardService = {
      copyToClipboard: jest.fn().mockResolvedValue(undefined),
    };
    component["clipboardService"] = clipboardService;
  });

  it("should not enable the copy button if the environment is not ready", () => {
    const testEnvironment = { ...environment };

    jest.spyOn(store, "select").mockReturnValue(of(testEnvironment));
    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);
    expect(component.disabled).toBe(false);

    testEnvironment.status = EnvironmentStatus.BROKEN;
    component.ngOnChanges({} as SimpleChanges);

    expect(component.disabled).toBe(true);
  });

  it("should copy the mxtest directory by default", () => {
    jest.spyOn(store, "select").mockReturnValue(of(environment));

    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);

    expect(component.pathToBeCopied).toEqual(
      `${OUTPUTS_REPOSITORY_URL}/mxtest`
    );
  });

  it("should copy the mxtest_web directory if a bundle type of mxtestweb is present", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        ...environment,
        bundles: [
          {
            id: "bundle-1",
            version: "1.0.0",
            branch: "main",
            changelist: "123",
            type: "mxtestweb",
          },
        ],
      })
    );

    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);

    expect(component.pathToBeCopied).toEqual(
      `${OUTPUTS_REPOSITORY_URL}/mxtest_web`
    );
  });

  it("should copy the mxtest_web directory if an is tool with name mxtestweb is present", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        ...environment,
        isTools: [{ name: "mxtestweb" }],
      })
    );

    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);

    expect(component.pathToBeCopied).toEqual(
      `${OUTPUTS_REPOSITORY_URL}/mxtest_web`
    );
  });

  it("should copy the mxtest_web directory if both a a bundle type of mxtestweb and an is tool with name mxtestweb are present", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        ...environment,
        isTools: [{ name: "mxtestweb" }],
        bundles: [
          {
            id: "bundle-1",
            version: "1.0.0",
            branch: "main",
            changelist: "123",
            type: "mxtestweb",
          },
        ],
      })
    );

    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);

    expect(component.pathToBeCopied).toEqual(
      `${OUTPUTS_REPOSITORY_URL}/mxtest_web`
    );
  });

  it("should close the observable for fetching the environment upon changes when the component is destroyed", () => {
    let observable = interval(100).pipe(concatMap((_) => of(environment)));
    let subject = new Subject();

    const environmentResponseObservable = merge(
      subject,
      observable
    ) as Observable<Environment>;

    jest.spyOn(store, "select").mockReturnValue(environmentResponseObservable);
    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  it("should check if the user has access to copy the mxtest details", () => {
    jest.spyOn(store, "select").mockReturnValue(of(environment));
    let isUserAuthorized = Math.random() > 0.5;
    authorizationService.isAuthorized = jest.fn(() => of(isUserAuthorized));

    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);

    expect(authorizationService.isAuthorized).toHaveBeenCalledWith(
      {
        action: "copy_mxtest_details",
        attributes: {},
        package: "web",
        resource: "environment_page",
      },
      projectId
    );
    expect(component.userHasAccessToCopyDetails).toEqual(isUserAuthorized);
  });

  it("should close the observable for checking the user authorization for the mxtest details when the component is destroyed", () => {
    jest.spyOn(store, "select").mockReturnValue(of(environment));
    let observable = interval(100).pipe(concatMap((_) => of(true)));
    let subject = new Subject();

    const authorizationResponseObservable = merge(
      subject,
      observable
    ) as Observable<boolean>;

    authorizationService.isAuthorized = jest.fn(
      () => authorizationResponseObservable
    );

    component.projectId = projectId;
    component.environmentId = environmentId;

    component.ngOnChanges({} as SimpleChanges);
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });
});
