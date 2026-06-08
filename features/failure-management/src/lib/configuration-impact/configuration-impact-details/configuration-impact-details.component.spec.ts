import { ConfigurationImpactDetailsComponent } from "./configuration-impact-details.component";
import { ConfigurationImpactService } from "../configuration-impact.service";
import { of, throwError } from "rxjs";
import { ConfigurationImpact } from "../model/configuration-impact";
import { ComponentFixture, TestBed } from "@angular/core/testing";

const configurationImpactId = "configurationImpactId";
const projectId = "projectId";
const creationDate = new Date();
const description = "description";
const title = "title";
const guiltyChange = "guiltyChange";
const owner = "owner";
const errorMessage = "errorMessage";
describe("configuration impact details component test", () => {
  let component: ConfigurationImpactDetailsComponent;
  let fixture: ComponentFixture<ConfigurationImpactDetailsComponent>;
  let service: ConfigurationImpactService;

  beforeEach(() => {
    service = {
      fetch: jest.fn(() => of(getConfigurationImpact())),
    } as unknown as ConfigurationImpactService;
    TestBed.configureTestingModule({
      imports: [ConfigurationImpactDetailsComponent],
    }).overrideComponent(ConfigurationImpactDetailsComponent, {
      set: {
        providers: [
          {
            provide: ConfigurationImpactService,
            useValue: service,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(ConfigurationImpactDetailsComponent);
    component = fixture.componentInstance;
  });

  it("should create the component correctly", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch the configuration impact details on initialization", () => {
    component.projectId = projectId;
    component.configurationImpactId = configurationImpactId;

    component.ngOnInit();

    expect(service.fetch).toHaveBeenCalledWith(
      projectId,
      configurationImpactId
    );
    expect(component.configurationImpact).toEqual(getConfigurationImpact());
    expect(component.isLoading).toBeFalsy();
  });

  it("should handle failing to fetch the configuration impact details on initialization", () => {
    component.projectId = projectId;
    component.configurationImpactId = configurationImpactId;
    const serviceMock = jest.spyOn(service, "fetch");
    serviceMock.mockReturnValue(throwError(() => new Error(errorMessage)));
    const errorMessageEmitterMock = jest.spyOn(
      component.errorMessageEmitter,
      "emit"
    );

    component.ngOnInit();

    expect(service.fetch).toHaveBeenCalledWith(
      projectId,
      configurationImpactId
    );
    expect(errorMessageEmitterMock).toHaveBeenCalledWith(errorMessage);
    expect(component.isLoading).toBeFalsy();
  });

  function getConfigurationImpact(): ConfigurationImpact {
    return {
      creationDate: creationDate,
      description: description,
      guiltyChange: guiltyChange,
      id: configurationImpactId,
      owner: owner,
      projectId: projectId,
      title: title,
    };
  }
});
