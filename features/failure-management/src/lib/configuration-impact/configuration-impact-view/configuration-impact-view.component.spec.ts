import { Store } from "@ngrx/store";
import { of } from "rxjs";
import { GlobalSelectors, Project } from "@mxflow/core/global-store";
import { ActivatedRoute } from "@angular/router";
import { ConfigurationImpactViewComponent } from "./configuration-impact-view.component";
import { ConfigurationImpactDetailsComponent } from "@mxflow/features/failure-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockBuilder } from "ng-mocks";

describe("ConfigurationImpactViewComponent", () => {
  const projectId = "projectId";
  const projectName = "projectName";
  const configurationImpactId = "configurationImpactId";
  const errorMessage = "error";

  let store: Store;
  let activatedRoute: ActivatedRoute;
  let toastMessageService: ToastMessageService;
  let component: ConfigurationImpactViewComponent;
  let fixture: ComponentFixture<ConfigurationImpactViewComponent>;

  beforeEach(async () => {
    store = {
      select: jest.fn(() => of(getProject())),
    } as unknown as Store;
    activatedRoute = {
      params: of({ configurationImpactId: configurationImpactId }),
    } as unknown as ActivatedRoute;
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    await MockBuilder(ConfigurationImpactViewComponent)
      .mock(ConfigurationImpactDetailsComponent)
      .mock(Store, store)
      .mock(ActivatedRoute, activatedRoute)
      .mock(ToastMessageService, toastMessageService);

    fixture = TestBed.createComponent(ConfigurationImpactViewComponent);
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

    it("should get configuration impact id from activated route", () => {
      component.ngOnInit();

      expect(component.configurationImpactId).toEqual(configurationImpactId);
    });
  });

  it("should destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should display error in message", () => {
    component.handleError(errorMessage);
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should handle edit", () => {
    component.handleEdit();

    expect(component.isEditModalVisible).toBeTruthy();
  });

  it("should handle modal closed event", () => {
    component.handleCloseModalEvent();

    expect(component.isEditModalVisible).toBeFalsy();
  });

  it("should handle edit successfully event", () => {
    component.detailsComponent = {
      ngOnInit: jest.fn(),
    } as unknown as ConfigurationImpactDetailsComponent;

    const detailsComponentMock = jest.spyOn(
      component.detailsComponent,
      "ngOnInit"
    );

    component.handleConfigurationImpactEdited();

    expect(detailsComponentMock).toHaveBeenCalled();
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
