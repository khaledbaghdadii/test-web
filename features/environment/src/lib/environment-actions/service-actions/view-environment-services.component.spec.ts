import { EnvironmentService } from "@mxflow/features/environment";
import { ViewEnvironmentServicesComponent } from "./view-environment-services.component";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { EnvironmentServiceModel } from "../../service/models/environment-service.model";
import { TestBed } from "@angular/core/testing";

const ENVIRONMENT_ID = "environmentId";
const PROJECT_ID = "projectId";
const ERROR_MESSAGE = "errorMessage";

describe("View environment services component", () => {
  let component: ViewEnvironmentServicesComponent;
  let environmentService: EnvironmentService;

  beforeEach(() => {
    environmentService = {
      getEnvironmentServices: jest
        .fn()
        .mockReturnValue(of(getEnvironmentServicesResponse())),
    } as unknown as EnvironmentService;

    TestBed.configureTestingModule({
      providers: [
        ViewEnvironmentServicesComponent,
        { provide: EnvironmentService, useValue: environmentService },
      ],
    });
    component = TestBed.inject(ViewEnvironmentServicesComponent);
    component.projectId = PROJECT_ID;
    component.environmentId = ENVIRONMENT_ID;
  });

  it("should call environment service with correct parameters on init", () => {
    const getEnvironmentServicesSpy = jest.spyOn(
      environmentService,
      "getEnvironmentServices"
    );
    component.dialogOpen = true;

    component.ngOnInit();

    expect(component.isOpen).toBe(true);
    expect(getEnvironmentServicesSpy).toHaveBeenCalledWith(
      PROJECT_ID,
      ENVIRONMENT_ID
    );
    expect(component.isLoading).toBe(false);
    expect(component.services).toStrictEqual([
      {
        name: "name1",
        nickname: "nickname1",
        installationCode: "installationCode1",
        description: "description1",
        status: "status1",
      },
      {
        name: "name2",
        nickname: "nickname2",
        installationCode: "installationCode2",
        description: "description2",
        status: "RUNNING",
      },
    ]);
  });

  it("should not retrieve the environment services on the component initialization if it was not requested in the input", () => {
    const getEnvironmentServicesSpy = jest.spyOn(
      environmentService,
      "getEnvironmentServices"
    );
    component.dialogOpen = false;

    component.ngOnInit();

    expect(component.isOpen).toBe(false);
    expect(getEnvironmentServicesSpy).not.toHaveBeenCalled();
  });

  it("should retrieve the environment services whenever the dialogue is opened", () => {
    const getEnvironmentServicesSpy = jest.spyOn(
      environmentService,
      "getEnvironmentServices"
    );
    component.dialogOpen = false;
    component.ngOnInit();
    component.dialogOpen = true;
    component.ngOnChanges({ dialogOpen: true });

    expect(getEnvironmentServicesSpy).toHaveBeenCalledWith(
      PROJECT_ID,
      ENVIRONMENT_ID
    );
    expect(component.isOpen).toBe(true);
    expect(component.services).toStrictEqual([
      {
        name: "name1",
        nickname: "nickname1",
        installationCode: "installationCode1",
        description: "description1",
        status: "status1",
      },
      {
        name: "name2",
        nickname: "nickname2",
        installationCode: "installationCode2",
        description: "description2",
        status: "RUNNING",
      },
    ]);
    expect(component.isLoading).toBe(false);
  });

  it("should close the observable from subscribing to the get environment services when the component is destroyed", () => {
    const observable = interval(100).pipe(concatMap(() => of({})));
    const subject = new Subject();

    environmentService.getEnvironmentServices = jest
      .fn()
      .mockReturnValue(merge(subject, observable));

    component.dialogOpen = true;
    component.ngOnInit();
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  it("should emit the correct event when the environment service fails to fetch services", () => {
    jest
      .spyOn(environmentService, "getEnvironmentServices")
      .mockReturnValue(throwError(() => ERROR_MESSAGE));
    const spy = jest.spyOn(component.servicesLoaded, "emit");
    component.dialogOpen = true;
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith({
      error: ERROR_MESSAGE,
      summary: "The request to fetch the environment services failed",
    });
  });

  it("should emit the correct event when the environment service is successful", () => {
    const spy = jest.spyOn(component.servicesLoaded, "emit");
    component.dialogOpen = true;
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it("should close the environment services view", () => {
    const spy = jest.spyOn(component.componentClosed, "emit");
    component.closeEnvironmentServicesView();
    expect(component.isOpen).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  function getEnvironmentServicesResponse(): EnvironmentServiceModel[] {
    return [
      {
        name: "name1",
        nickname: "nickname1",
        installationCode: "installationCode1",
        description: "description1",
        status: "status1",
      },
      {
        name: "name2",
        nickname: "nickname2",
        installationCode: "installationCode2",
        description: "description2",
        status: "RUNNING",
      },
    ];
  }
});
