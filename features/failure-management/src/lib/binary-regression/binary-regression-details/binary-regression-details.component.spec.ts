import { BinaryRegression } from "../binary-regression";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { BinaryRegressionDetailsComponent } from "./binary-regression-details.component";
import { EventEmitter } from "@angular/core";
import { of, throwError } from "rxjs";
import { Project, ProjectService } from "@mxflow/features/project";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("BinaryRegressionDetailsComponent", () => {
  const projectId = "projectId";
  const binaryRegressionId = "binaryRegressionId";
  const errorMessage = "error";

  let errorMessageEmitter: EventEmitter<string>;
  let component: BinaryRegressionDetailsComponent;
  let fixture: ComponentFixture<BinaryRegressionDetailsComponent>;
  let binaryRegressionsService: BinaryRegressionDataService;
  let projectService: ProjectService;

  beforeEach(() => {
    binaryRegressionsService = {
      getBinaryRegressionById: jest.fn(),
    } as unknown as BinaryRegressionDataService;

    projectService = {
      getProjectById: jest.fn(),
    } as unknown as ProjectService;

    errorMessageEmitter = {
      emit: jest.fn(),
    } as unknown as EventEmitter<string>;

    TestBed.configureTestingModule({
      imports: [BinaryRegressionDetailsComponent],
    }).overrideComponent(BinaryRegressionDetailsComponent, {
      set: {
        providers: [
          {
            provide: BinaryRegressionDataService,
            useValue: binaryRegressionsService,
          },
          {
            provide: ProjectService,
            useValue: projectService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(BinaryRegressionDetailsComponent);
    component = fixture.componentInstance;
    component.errorMessageEmitter = errorMessageEmitter;
    component.binaryRegressionId = binaryRegressionId;
    component.projectId = projectId;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("on init", () => {
    it("should get binary regression by id correctly", () => {
      const response = getBinaryRegression();
      jest
        .spyOn(binaryRegressionsService, "getBinaryRegressionById")
        .mockReturnValue(of(response));

      component.ngOnInit();

      expect(
        binaryRegressionsService.getBinaryRegressionById
      ).toHaveBeenCalledTimes(1);
      expect(
        binaryRegressionsService.getBinaryRegressionById
      ).toHaveBeenCalledWith(binaryRegressionId);
      expect(component.binaryRegression).toEqual(response);
    });

    it("should emit error when get binary regression by id fails", () => {
      jest
        .spyOn(binaryRegressionsService, "getBinaryRegressionById")
        .mockReturnValue(throwError(() => errorMessage));

      component.ngOnInit();

      expect(
        binaryRegressionsService.getBinaryRegressionById
      ).toHaveBeenCalledWith(binaryRegressionId);
      expect(component.binaryRegression).toBeUndefined();
      expect(errorMessageEmitter.emit).toHaveBeenCalledTimes(1);
      expect(errorMessageEmitter.emit).toHaveBeenCalledWith(errorMessage);
    });

    it("should emit error when get project by id fails", () => {
      const response = getBinaryRegression();
      jest
        .spyOn(binaryRegressionsService, "getBinaryRegressionById")
        .mockReturnValue(of(response));
      jest
        .spyOn(projectService, "getProjectById")
        .mockReturnValue(throwError(() => errorMessage));

      component.ngOnInit();

      expect(projectService.getProjectById).toHaveBeenCalledWith(
        response.projectId
      );
      expect(component.projectName).toEqual("-");
      expect(errorMessageEmitter.emit).toHaveBeenCalledTimes(1);
      expect(errorMessageEmitter.emit).toHaveBeenCalledWith(errorMessage);
    });

    it("should set isLoading to false when get binary regression by id fails", () => {
      jest
        .spyOn(binaryRegressionsService, "getBinaryRegressionById")
        .mockReturnValue(throwError(() => errorMessage));

      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });

    it("should set isLoading to false when get binary regression by id succeeds", () => {
      const response = getBinaryRegression();
      jest
        .spyOn(binaryRegressionsService, "getBinaryRegressionById")
        .mockReturnValue(of(response));

      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });

    it("should set isLoading to false when get project by id fails", () => {
      const regression = getBinaryRegression();
      jest
        .spyOn(binaryRegressionsService, "getBinaryRegressionById")
        .mockReturnValue(of(regression));
      jest
        .spyOn(projectService, "getProjectById")
        .mockReturnValue(throwError(() => errorMessage));

      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });

    it("should set isLoading to false when get project by id succeeds", () => {
      const regression = getBinaryRegression();
      jest
        .spyOn(binaryRegressionsService, "getBinaryRegressionById")
        .mockReturnValue(of(regression));
      const response = getProject();
      jest
        .spyOn(projectService, "getProjectById")
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

  it("should fetch project name if project id of binary regression is not null", () => {
    const response = getBinaryRegression();
    jest
      .spyOn(binaryRegressionsService, "getBinaryRegressionById")
      .mockReturnValue(of(response));
    jest
      .spyOn(projectService, "getProjectById")
      .mockReturnValue(of(getProject()));

    component.ngOnInit();

    expect(projectService.getProjectById).toHaveBeenCalledTimes(1);
    expect(projectService.getProjectById).toHaveBeenCalledWith(
      response.projectId
    );
    expect(component.projectName).toEqual(getProject().name);
  });
  it("should not fetch project name if project id of binary regression is null", () => {
    const response = getMaskedBinaryRegression();
    jest
      .spyOn(binaryRegressionsService, "getBinaryRegressionById")
      .mockReturnValue(of(response));
    jest
      .spyOn(projectService, "getProjectById")
      .mockReturnValue(of(getProject()));

    component.ngOnInit();

    expect(projectService.getProjectById).toHaveBeenCalledTimes(0);
    expect(component.projectName).toEqual("-");
  });
});

function getBinaryRegression(): BinaryRegression {
  return {
    id: "1",
    projectId: "projectId",
    title: "title",
    description: "description",
    defect: {
      id: "id",
      link: "link",
    },
    fix: "fix",
    owner: "owner",
    mxVersion: "mxVersion",
    incidentId: "incidentId",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}

function getMaskedBinaryRegression(): BinaryRegression {
  return {
    id: "1",
    projectId: undefined,
    title: "title",
    description: "description",
    defect: {
      id: "id",
      link: "link",
    },
    fix: "fix",
    owner: undefined,
    mxVersion: "mxVersion",
    incidentId: "incidentId",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}

function getProject(): Project {
  return {
    id: "projectId",
    name: "projectName",
    description: "description",
    creationDate: "2024-03-22T07:42:18.196Z",
  };
}
