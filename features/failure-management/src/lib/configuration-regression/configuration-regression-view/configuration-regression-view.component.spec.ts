import { Store } from "@ngrx/store";
import { ConfigurationRegressionViewComponent } from "./configuration-regression-view.component";
import { of } from "rxjs";
import { GlobalSelectors, Project } from "@mxflow/core/global-store";
import { ActivatedRoute } from "@angular/router";
import { ConfigurationRegressionDetailsComponent } from "@mxflow/features/failure-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockBuilder } from "ng-mocks";

describe("ConfigurationRegressionDetailsComponent", () => {
  const projectId = "projectId";
  const projectName = "projectName";
  const configurationRegressionId = "configurationRegressionId";
  const errorMessage = "error";

  let store: Store;
  let activatedRoute: ActivatedRoute;
  let toastMessageService: ToastMessageService;
  let component: ConfigurationRegressionViewComponent;
  let fixture: ComponentFixture<ConfigurationRegressionViewComponent>;

  beforeEach(async () => {
    store = {
      select: jest.fn(() => of(getProject())),
    } as unknown as Store;
    activatedRoute = {
      params: of({ "configuration-regression-id": configurationRegressionId }),
    } as unknown as ActivatedRoute;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    await MockBuilder(ConfigurationRegressionViewComponent)
      .mock(ConfigurationRegressionDetailsComponent)
      .mock(Store, store)
      .mock(ActivatedRoute, activatedRoute)
      .mock(ToastMessageService, toastMessageService);

    fixture = TestBed.createComponent(ConfigurationRegressionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("on init", () => {
    it("should get project name and id from store", () => {
      component.ngOnInit();

      expect(store.select).toHaveBeenCalledWith(GlobalSelectors.getProject);
      expect(component.projectName).toEqual(projectName);
      expect(component.projectId).toEqual(projectId);
    });

    it("should get configurationRegressionId from activated route", () => {
      component.ngOnInit();

      expect(component.configurationRegressionId).toEqual(
        "configurationRegressionId"
      );
    });
  });

  it("should destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should clear previous error message and display new one", () => {
    component.handleError(errorMessage);

    expect(component.errorMessage).toEqual(errorMessage);
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should open the modal when the edit is clicked", () => {
    component.handleEdit();
    expect(component.showEditConfigurationRegressionModal).toBeTruthy();
  });

  it("should close the modal when the cancel or close are clicked", () => {
    component.handleCloseModalEvent();
    expect(component.showEditConfigurationRegressionModal).toBeFalsy();
  });

  it("should call on init of the details component to refresh the data", () => {
    component.configurationRegressionDetailsComponent = {
      ngOnInit: jest.fn(),
    } as unknown as ConfigurationRegressionDetailsComponent;
    const detailsComponentMock = jest.spyOn(
      component.configurationRegressionDetailsComponent,
      "ngOnInit"
    );
    component.handleConfigurationRegressionEdited();
    expect(detailsComponentMock).toHaveBeenCalled();
  });

  it("should handle on destroy correctly", () => {
    const destroyNextMock = jest.spyOn(component.destroy$, "next");
    const destroyCompleteMock = jest.spyOn(component.destroy$, "complete");
    component.ngOnDestroy();
    expect(destroyNextMock).toHaveBeenCalled();
    expect(destroyCompleteMock).toHaveBeenCalled();
  });
});

function getProject(): Project {
  return {
    id: "projectId",
    name: "projectName",
    description: "projectDescription",
    creationDate: "2021-01-01T00:00:00Z",
  };
}
