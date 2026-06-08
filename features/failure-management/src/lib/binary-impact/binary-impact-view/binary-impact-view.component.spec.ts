import { BinaryImpactViewComponent } from "./binary-impact-view.component";
import { Store } from "@ngrx/store";
import { of } from "rxjs";
import { Project } from "@mxflow/core/global-store";
import { ActivatedRoute } from "@angular/router";
import { BinaryImpactDetailsComponent } from "@mxflow/features/failure-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockBuilder } from "ng-mocks";

describe("BinaryImpactViewComponent", () => {
  const PROJECT_ID = "projectId";
  const PROJECT_NAME = "projectName";
  const BINARY_IMPACT_ID = "binaryImpactId";

  let store: Store;
  let activatedRoute: ActivatedRoute;
  let component: BinaryImpactViewComponent;
  let toastMessageService: ToastMessageService;
  let fixture: ComponentFixture<BinaryImpactViewComponent>;

  beforeEach(async () => {
    store = {
      select: jest.fn(() => of(getProject())),
    } as unknown as Store;
    activatedRoute = {
      params: of({ "binary-impact-id": BINARY_IMPACT_ID }),
    } as unknown as ActivatedRoute;
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    await MockBuilder(BinaryImpactViewComponent)
      .mock(BinaryImpactDetailsComponent)
      .mock(Store, store)
      .mock(ActivatedRoute, activatedRoute)
      .mock(ToastMessageService, toastMessageService);

    fixture = TestBed.createComponent(BinaryImpactViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should fetch project name and id from store", () => {
      component.ngOnInit();

      expect(store.select).toHaveBeenCalled();
      expect(component.projectId).toEqual(PROJECT_ID);
      expect(component.projectName).toEqual(PROJECT_NAME);
    });

    it("should get binary impact id from activated route", () => {
      component.ngOnInit();

      expect(component.binaryImpactId).toEqual(BINARY_IMPACT_ID);
    });
  });

  it("should destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should display error message", () => {
    component.handleError("errorMessage");

    expect(toastMessageService.showError).toHaveBeenCalledWith("errorMessage");
  });

  it("should set edit modal visible to true when edit is called", () => {
    component.isEditModalVisible = false;

    component.handleEdit();

    expect(component.isEditModalVisible).toBeTruthy();
  });

  it("should set edit modal visible to false when close is called", () => {
    component.isEditModalVisible = true;

    component.handleCloseModalEvent();

    expect(component.isEditModalVisible).toBeFalsy();
  });

  it("should re-initialize on successful binary impact edit", () => {
    component.detailsComponent = {
      ngOnInit: jest.fn(),
    } as unknown as BinaryImpactDetailsComponent;
    const detailsComponentMock = jest.spyOn(
      component.detailsComponent,
      "ngOnInit"
    );

    component.handleBinaryImpactEdited();

    expect(detailsComponentMock).toHaveBeenCalled();
  });

  function getProject(): Project {
    return {
      id: PROJECT_ID,
      name: PROJECT_NAME,
      description: "projectDescription",
      creationDate: "2021-01-01T00:00:00Z",
    };
  }
});
