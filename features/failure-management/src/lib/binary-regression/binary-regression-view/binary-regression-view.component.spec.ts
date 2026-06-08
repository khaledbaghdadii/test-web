import { BinaryRegressionViewComponent } from "./binary-regression-view.component";
import { ActivatedRoute } from "@angular/router";
import { Store } from "@ngrx/store";
import { of } from "rxjs";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Project } from "@mxflow/features/project";
import { BinaryRegressionDetailsComponent } from "@mxflow/features/failure-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockBuilder } from "ng-mocks";

describe("BinaryRegressionViewComponent", () => {
  const projectId = "projectId";
  const projectName = "projectName";
  const binaryRegressionId = "binary-regression-id";
  const errorMessage = "error";

  let store: Store;
  let activatedRoute: ActivatedRoute;
  let toastMessageService: ToastMessageService;
  let component: BinaryRegressionViewComponent;
  let fixture: ComponentFixture<BinaryRegressionViewComponent>;

  beforeEach(async () => {
    store = {
      select: jest.fn(() => of(getProject())),
    } as unknown as Store;
    activatedRoute = {
      params: of({ "binary-regression-id": binaryRegressionId }),
    } as unknown as ActivatedRoute;
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    await MockBuilder(BinaryRegressionViewComponent)
      .mock(BinaryRegressionDetailsComponent)
      .mock(Store, store)
      .mock(ActivatedRoute, activatedRoute)
      .mock(ToastMessageService, toastMessageService);

    fixture = TestBed.createComponent(BinaryRegressionViewComponent);
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

    it("should get binaryRegressionId from activated route", () => {
      component.ngOnInit();

      expect(component.binaryRegressionId).toEqual(binaryRegressionId);
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

  it("should handle edit on button click", () => {
    component.handleEdit();

    expect(component.isEditModalShown).toBeTruthy();
  });

  it("should set edit modal visibility to false when close edit modal event is received", () => {
    component.handleCloseEditModal();

    expect(component.isEditModalShown).toBeFalsy();
  });

  it("should refresh the details component when binary regression is edited", () => {
    component.detailsComponent = {
      ngOnInit: jest.fn(),
    } as unknown as BinaryRegressionDetailsComponent;

    component.handleBinaryRegressionEdited();

    expect(component.detailsComponent.ngOnInit).toHaveBeenCalled();
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
