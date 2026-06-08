import { DeployClientButtonComponent } from "./deploy-client-button.component";
import {
  interval,
  map,
  merge,
  Observable,
  of,
  Subject,
  throwError,
} from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { EnvironmentClientLauncherService } from "../../service/environment-client-launcher-service";
import {
  Environment,
  EnvironmentAction,
} from "../../service/models/environment.model";
import { Store } from "@ngrx/store";
import { EnvironmentsState } from "../../store/environment/environments.state";
import { HttpErrorResponse } from "@angular/common/http";

describe("DeployClientButtonComponent", () => {
  let messageService: jest.Mocked<ToastMessageService>;
  let clientLauncherService: jest.Mocked<EnvironmentClientLauncherService>;
  let component: DeployClientButtonComponent;
  let store: Store<EnvironmentsState>;

  beforeEach(async () => {
    messageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    clientLauncherService = {
      launchSecureClient: jest.fn(),
      launchClient: jest.fn(() => of()),
      launchWebClient: jest.fn(),
    } as unknown as jest.Mocked<EnvironmentClientLauncherService>;

    store = {
      select: jest.fn(() => of(environment)),
    } as unknown as Store<EnvironmentsState>;

    component = new DeployClientButtonComponent(
      messageService,
      clientLauncherService,
      store
    );

    component.projectId = "testProjectId";
    component.environmentId = "testEnvironmentId";
    component.disabled = false;
  });

  it("should retrieve the environment details upon the component initialization", () => {
    component.ngOnInit();

    expect(store.select).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should unsubscribe from the environment details retrieval observable if it outlives the component", () => {
    let observable = interval(100).pipe(map(() => environment));
    let subject = new Subject();
    let environmentObservable = merge(
      subject,
      observable
    ) as Observable<Environment>;
    jest.spyOn(store, "select").mockReturnValue(environmentObservable);

    component.ngOnInit();

    expect(subject.observed).toEqual(true);

    component.ngOnDestroy();

    expect(subject.observed).toEqual(false);
  });

  it("should show the web client as the default button in the dropdown when available", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [
          EnvironmentAction.WEB_CLIENT,
          EnvironmentAction.CLIENT,
          EnvironmentAction.SECURE_CLIENT,
        ],
        webClientUrl: "http://web-client",
      } as Environment)
    );

    component.ngOnInit();

    expect(component.defaultClient).toEqual("Open Web Client");
  });

  it("should call the launcher service to open the web client when the default button is clicked and the web client is supported", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [
          EnvironmentAction.WEB_CLIENT,
          EnvironmentAction.CLIENT,
          EnvironmentAction.SECURE_CLIENT,
        ],
        webClientUrl: "http://web-client",
      } as Environment)
    );

    component.ngOnInit();
    expect(component.defaultClientIsDisabled).toEqual(false);

    component.launchDefaultClient();

    expect(clientLauncherService.launchWebClient).toHaveBeenCalledWith(
      "http://web-client"
    );
  });

  it("should disable the default button when the web client is supported but the url is not available", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [
          EnvironmentAction.WEB_CLIENT,
          EnvironmentAction.CLIENT,
        ],
      } as Environment)
    );

    component.ngOnInit();

    expect(component.defaultClientIsDisabled).toEqual(true);
    expect(component.tooltipMessage).toEqual("Web client is not available");
  });

  it("should disable the button when the only web client is supported but the url is not available", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.WEB_CLIENT],
      } as Environment)
    );

    component.ngOnInit();

    expect(component.disabled).toEqual(false);
    expect(component.defaultClientIsDisabled).toEqual(true);
    expect(component.tooltipMessage).toEqual("Web client is not available");
  });

  it("should show the secure client as the default button in the dropdown when supported and the web client is not", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [
          EnvironmentAction.CLIENT,
          EnvironmentAction.SECURE_CLIENT,
        ],
      } as Environment)
    );

    component.ngOnInit();

    expect(component.defaultClient).toEqual("Open MX.3 Client TLS");
  });

  it("should call the launcher service top open the secure client when default button is clicked in case of secure deployment", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.SECURE_CLIENT],
        secureClientArtifactUri: "this-nexus-uri",
      } as Environment)
    );
    component.ngOnInit();
    expect(component.defaultClient).toEqual("Open MX.3 Client TLS");

    component.launchDefaultClient();
    expect(clientLauncherService.launchSecureClient).toHaveBeenCalledWith(
      "testEnvironmentId",
      "client_tls",
      "this-nexus-uri"
    );
  });

  it("should show the mx.3 client as the default button in the dropdown when the mx.3 client is the only one supported", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.CLIENT],
      } as Environment)
    );

    component.ngOnInit();

    expect(component.defaultClient).toEqual("Open MX.3 Client");
  });

  it("should show the mx.3 client as the default button in the dropdown when no client is available for backward compatibility", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [] as EnvironmentAction[],
      } as Environment)
    );

    component.ngOnInit();

    expect(component.defaultClient).toEqual("Open MX.3 Client");
  });

  it("should call the launcher service to open the mx.3 client when the default button is clicked and only the mx.3 client is supported", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.CLIENT],
      } as Environment)
    );

    component.ngOnInit();
    component.launchDefaultClient();

    expect(clientLauncherService.launchClient).toHaveBeenCalledWith(
      "testProjectId",
      "testEnvironmentId",
      "client"
    );
  });

  it("should call the launcher service to open the mx.3 client when the default button is clicked and no client is supported for backward compatability", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [] as EnvironmentAction[],
      } as Environment)
    );

    component.ngOnInit();
    component.launchDefaultClient();

    expect(clientLauncherService.launchClient).toHaveBeenCalledWith(
      "testProjectId",
      "testEnvironmentId",
      "client"
    );
  });

  it("should build the launchers list correctly if the secure client is supported", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.SECURE_CLIENT],
        secureClientArtifactUri: "this-nexus-uri",
      } as Environment)
    );

    component.ngOnInit();

    expect(component.launchers[0].label).toEqual("MX.3 Client TLS");
    expect(component.launchers[0].tooltipOptions).toBeDefined();
    expect(component.launchers[0].tooltipOptions!.tooltipLabel).toEqual(
      "client_TLS.cmd"
    );
    let mx3ClientLauncher = component.launchers[0].command as () => void;
    mx3ClientLauncher();
    expect(clientLauncherService.launchSecureClient).toHaveBeenCalledWith(
      "testEnvironmentId",
      "client_tls",
      "this-nexus-uri"
    );

    expect(component.launchers[1].label).toEqual("Monitor Services TLS");
    expect(component.launchers[1].tooltipOptions).toBeDefined();
    expect(component.launchers[1].tooltipOptions!.tooltipLabel).toEqual(
      "monit_TLS.cmd"
    );
    let monitorClientLauncher = component.launchers[1].command as () => void;
    monitorClientLauncher();
    expect(clientLauncherService.launchSecureClient).toHaveBeenCalledWith(
      "testEnvironmentId",
      "monit_tls",
      "this-nexus-uri"
    );

    expect(component.launchers[2].label).toEqual("Rich Client TLS");
    expect(component.launchers[2].tooltipOptions).toBeDefined();
    expect(component.launchers[2].tooltipOptions!.tooltipLabel).toEqual(
      "richclient_TLS.cmd"
    );
    let richClientLauncher = component.launchers[2].command as () => void;
    richClientLauncher();
    expect(clientLauncherService.launchSecureClient).toHaveBeenCalledWith(
      "testEnvironmentId",
      "richclient_tls",
      "this-nexus-uri"
    );

    expect(component.launchers[3].label).toEqual("Browse TLS Client Repo");
    expect(component.launchers[3].tooltipOptions).toBeDefined();
    expect(component.launchers[3].tooltipOptions!.tooltipLabel).toEqual(
      "Opens client directory"
    );
    let browseDir = component.launchers[3].command as () => void;
    browseDir();
    expect(clientLauncherService.launchSecureClient).toHaveBeenCalledWith(
      "testEnvironmentId",
      "",
      "this-nexus-uri"
    );
  });

  it("should build the launchers list correctly if the regular client is supported", () => {
    component.ngOnInit();

    expect(component.launchers[0].label).toEqual("MX.3 Client");
    expect(component.launchers[0].tooltipOptions).toBeDefined();
    expect(component.launchers[0].tooltipOptions!.tooltipLabel).toEqual(
      "client.cmd"
    );
    let mx3ClientLauncher = component.launchers[0].command as () => void;
    mx3ClientLauncher();
    expect(clientLauncherService.launchClient).toHaveBeenCalledWith(
      "testProjectId",
      "testEnvironmentId",
      "client"
    );

    expect(component.launchers[1].label).toEqual("Monitor Services");
    expect(component.launchers[1].tooltipOptions).toBeDefined();
    expect(component.launchers[1].tooltipOptions!.tooltipLabel).toEqual(
      "monit.cmd"
    );
    let monitorClientLauncher = component.launchers[1].command as () => void;
    monitorClientLauncher();
    expect(clientLauncherService.launchClient).toHaveBeenCalledWith(
      "testProjectId",
      "testEnvironmentId",
      "monit"
    );

    expect(component.launchers[2].label).toEqual("Rich Client");
    expect(component.launchers[2].tooltipOptions).toBeDefined();
    expect(component.launchers[2].tooltipOptions!.tooltipLabel).toEqual(
      "richclient.cmd"
    );
    let richClientLauncher = component.launchers[2].command as () => void;
    richClientLauncher();
    expect(clientLauncherService.launchClient).toHaveBeenCalledWith(
      "testProjectId",
      "testEnvironmentId",
      "richclient"
    );

    expect(component.launchers[3].label).toEqual("Browse Client Repo");
    expect(component.launchers[3].tooltipOptions).toBeDefined();
    expect(component.launchers[3].tooltipOptions!.tooltipLabel).toEqual(
      "Opens client directory"
    );
    let browseDir = component.launchers[3].command as () => void;
    browseDir();
    expect(clientLauncherService.launchClient).toHaveBeenCalledWith(
      "testProjectId",
      "testEnvironmentId",
      ""
    );
  });

  it("should add the regular client items to the list if no client is supported for backward compatibility", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [] as EnvironmentAction[],
      } as Environment)
    );

    component.ngOnInit();

    expect(component.launchers.length).toEqual(4);
  });

  it("should disable the button if the nexus URI is empty when the secure client is enabled and the web client is not", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.SECURE_CLIENT],
      } as Environment)
    );
    component.ngOnInit();
    expect(component.disabled).toBe(true);
  });

  it("should disable the dropdown if the nexus URI is empty when the secure client and the web client are enabled", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [
          EnvironmentAction.SECURE_CLIENT,
          EnvironmentAction.WEB_CLIENT,
        ],
        webClientUrl: "http://web-client",
      } as Environment)
    );
    component.ngOnInit();
    expect(component.disabled).toBe(false);
    expect(component.launchers.length).toEqual(0);
    expect(component.tooltipMessage).toEqual("TLS client is not available");
  });

  it("should disable the default button if the nexus URI is available and the web client url is not when the secure client and the web client are enabled", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [
          EnvironmentAction.SECURE_CLIENT,
          EnvironmentAction.WEB_CLIENT,
        ],
        secureClientArtifactUri: "this-nexus-uri",
      } as Environment)
    );
    component.ngOnInit();
    expect(component.disabled).toBe(false);
    expect(component.defaultClientIsDisabled).toBe(true);
    expect(component.launchers.length).not.toEqual(0);
    expect(component.tooltipMessage).toEqual("Web client is not available");
  });

  it("should disable the button if both the nexus URI and the web client url are not available when the secure client and the web client are enabled", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [
          EnvironmentAction.SECURE_CLIENT,
          EnvironmentAction.WEB_CLIENT,
        ],
      } as Environment)
    );
    component.ngOnInit();
    expect(component.disabled).toBe(true);
    expect(component.defaultClientIsDisabled).toBe(true);
    expect(component.tooltipMessage).toEqual(
      "Web client and TLS clients are not available"
    );
  });

  it("should return a tooltip in case of TLS if nexus URI is empty", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.SECURE_CLIENT],
      } as Environment)
    );
    component.ngOnInit();
    expect(component.tooltipMessage).toEqual("TLS client is not available");
  });

  it("should handle error when launching client", () => {
    const errorMessage = "Error launching client";
    clientLauncherService.launchClient.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );

    const showFailureAlertSpy = jest.spyOn(
      component as any,
      "showFailureAlert"
    );

    component.deployClient("client");

    expect(showFailureAlertSpy).toHaveBeenCalledWith(errorMessage);
  });

  it("should unsubscribe from the launch client observable if it outlives the component", () => {
    let observable = interval(100).pipe(map(() => environment));
    let subject = new Subject();
    let launchClient = merge(subject, observable) as Observable<void>;
    clientLauncherService.launchClient.mockReturnValue(launchClient);

    component.ngOnInit();
    component.deployClient("client");

    expect(subject.observed).toEqual(true);

    component.ngOnDestroy();

    expect(subject.observed).toEqual(false);
  });

  it("should show an error message when it fails to launch the mx.3 client when it is the default button", () => {
    let message = "Failed to launch client";
    clientLauncherService.launchClient.mockReturnValue(
      throwError(() => new Error(message))
    );

    jest.spyOn(store, "select").mockReturnValue(
      of({
        environmentActions: [EnvironmentAction.CLIENT],
      } as Environment)
    );

    component.ngOnInit();
    component.launchDefaultClient();

    expect(messageService.showError).toHaveBeenCalledWith(
      message,
      "Error while opening client"
    );
  });

  it("should unsubscribe form the observable of the mx.3 client launch when it is the default button and outlives the component", () => {
    let observable = interval(100).pipe(map(() => void 0));
    let subject = new Subject();
    let clientObservable = merge(subject, observable) as Observable<void>;

    clientLauncherService.launchClient.mockReturnValue(clientObservable);

    component.ngOnInit();
    component.launchDefaultClient();

    expect(subject.observed).toEqual(true);

    component.ngOnDestroy();

    expect(subject.observed).toEqual(false);
  });

  it("should handle error when build is purged", () => {
    const errorMessage =
      "The build ID is purged, please make sure to generate new MX.3 setups and to deploy a new environment";
    const error = new HttpErrorResponse({
      error: { message: errorMessage },
      status: 400,
    });
    clientLauncherService.launchClient.mockReturnValue(throwError(() => error));

    const showFailureAlertSpy = jest.spyOn(
      component as any,
      "showFailureAlert"
    );

    component.deployClient("client");

    expect(showFailureAlertSpy).toHaveBeenCalledWith(errorMessage);
    expect(component.disabled).toBe(true);
    expect(component.tooltipMessage).toEqual(errorMessage);
  });
});

const environment = {
  id: "testEnvironmentId",
  environmentActions: [EnvironmentAction.CLIENT],
} as Environment;
