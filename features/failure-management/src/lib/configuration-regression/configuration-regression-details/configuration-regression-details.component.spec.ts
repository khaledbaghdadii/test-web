import { ConfigurationRegressionService } from "../configuration-regression.service";
import { ConfigurationRegressionDetailsComponent } from "./configuration-regression-details.component";
import { of, throwError } from "rxjs";
import { ConfigurationRegression } from "../model/configuration-regression";
import { EventEmitter } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("ConfigurationRegressionDetailsComponent", () => {
  const projectId = "projectId";
  const configurationRegressionId = "configurationRegressionId";
  const errorMessage = "error";

  let errorMessageEmitter: EventEmitter<string>;
  let component: ConfigurationRegressionDetailsComponent;
  let fixture: ComponentFixture<ConfigurationRegressionDetailsComponent>;
  let configurationRegressionsService: ConfigurationRegressionService;

  beforeEach(() => {
    configurationRegressionsService = {
      fetch: jest.fn(),
    } as unknown as ConfigurationRegressionService;
    errorMessageEmitter = {
      emit: jest.fn(),
    } as unknown as EventEmitter<string>;

    TestBed.configureTestingModule({
      imports: [ConfigurationRegressionDetailsComponent],
    }).overrideComponent(ConfigurationRegressionDetailsComponent, {
      set: {
        providers: [
          {
            provide: ConfigurationRegressionService,
            useValue: configurationRegressionsService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(ConfigurationRegressionDetailsComponent);
    component = fixture.componentInstance;

    component.errorMessageEmitter = errorMessageEmitter;
    component.configurationRegressionId = configurationRegressionId;
    component.projectId = projectId;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("on init", () => {
    it("should get config regression details correctly", () => {
      const response = getConfigurationRegression();
      jest
        .spyOn(configurationRegressionsService, "fetch")
        .mockReturnValue(of(response));

      component.ngOnInit();

      expect(configurationRegressionsService.fetch).toHaveBeenCalledTimes(1);
      expect(configurationRegressionsService.fetch).toHaveBeenCalledWith(
        projectId,
        configurationRegressionId
      );
      expect(component.configurationRegression).toEqual(response);
    });

    it("should emit error when get config regression by id fails", () => {
      jest
        .spyOn(configurationRegressionsService, "fetch")
        .mockReturnValue(throwError(() => new Error(errorMessage)));

      component.ngOnInit();

      expect(configurationRegressionsService.fetch).toHaveBeenCalledWith(
        projectId,
        configurationRegressionId
      );
      expect(component.configurationRegression).toBeUndefined();
      expect(errorMessageEmitter.emit).toHaveBeenCalledTimes(1);
      expect(errorMessageEmitter.emit).toHaveBeenCalledWith(errorMessage);
    });

    it("should set isLoading to false when get config regression by id fails", () => {
      jest
        .spyOn(configurationRegressionsService, "fetch")
        .mockReturnValue(throwError(() => errorMessage));

      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });

    it("should set isLoading to false when get config regression by id succeeds", () => {
      const response = getConfigurationRegression();
      jest
        .spyOn(configurationRegressionsService, "fetch")
        .mockReturnValue(of(response));

      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });
  });

  it("ngOnDestroy should unsubscribe", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});

function getConfigurationRegression(): ConfigurationRegression {
  return {
    id: "1",
    projectId: "projectId",
    title: "title",
    description: "description",
    guiltyChange: "guiltyChange",
    fix: "fix",
    owner: "owner",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}
