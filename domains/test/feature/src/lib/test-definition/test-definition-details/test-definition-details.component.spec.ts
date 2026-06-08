import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestDefinitionDetailsComponent } from "./test-definition-details.component";
import { TableModule } from "primeng/table";
import { of, throwError } from "rxjs";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { ActivatedRoute } from "@angular/router";
import { Store } from "@ngrx/store";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { MockComponent, MockDirectives, MockModule, ngMocks } from "ng-mocks";
import { ButtonModule } from "primeng/button";
import { By } from "@angular/platform-browser";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition } from "@mxevolve/domains/test/model";
import { TestSelectionTableComponent } from "../test-selection/test-selection-table/test-selection-table.component";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { CardContainerModule } from "@mxflow/ui/container";

describe("Test Selection Table", () => {
  let fixture: ComponentFixture<TestDefinitionDetailsComponent>;
  let component: TestDefinitionDetailsComponent;
  let testDefinitionService: jest.Mocked<TestDefinitionService>;
  let repositoryService: jest.Mocked<RepositoryService>;
  let store: Store;
  let route: ActivatedRoute;
  let toastMessageService: jest.Mocked<ToastMessageService>;

  const PROJECT_ID = "PROJECT_ID";
  const TEST_DEFINITION_ID = "TEST_DEFINITION_ID";
  const REPOSITORY_ID = "REPOSITORY_ID";
  const testDefinition = {
    id: TEST_DEFINITION_ID,
  } as unknown as TestDefinition;
  const repository = {
    id: REPOSITORY_ID,
  } as unknown as Repository;
  beforeEach(() => {
    store = {
      select: jest.fn().mockReturnValue(of(PROJECT_ID)),
    } as unknown as Store;

    route = {
      params: of({
        testDefinitionId: TEST_DEFINITION_ID,
      }),
    } as unknown as ActivatedRoute;

    testDefinitionService = {
      fetch: jest.fn().mockReturnValue(of(testDefinition)),
    } as unknown as jest.Mocked<TestDefinitionService>;

    repositoryService = {
      getRepoById: jest.fn().mockReturnValue(of(repository)),
    } as unknown as jest.Mocked<RepositoryService>;

    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    TestBed.configureTestingModule({
      imports: [
        TestDefinitionDetailsComponent,
        MockDirectives(ShowElementIfAuthorizedDirective),
        TableModule,
        ButtonModule,
        MockModule(HeaderTitleModule),
        MockModule(CardContainerModule),
        MockComponent(TestSelectionTableComponent),
        MockDirectives(ShowElementIfAuthorizedDirective),
      ],
      providers: [
        { provide: TestDefinitionService, useValue: testDefinitionService },
        { provide: ActivatedRoute, useValue: route },
        { provide: Store, useValue: store },
        { provide: RepositoryService, useValue: repositoryService },
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    });

    fixture = TestBed.createComponent(TestDefinitionDetailsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  describe("onInit", () => {
    it("should set iniital variables if store fetches project ID correctly", () => {
      expect(component).toBeTruthy();
      expect(component.projectId).toEqual(PROJECT_ID);
      expect(component.testDefinition).toEqual(testDefinition);
      expect(component.isLoading).toBeFalsy();
      expect(component.testRepo).toEqual(repository);
    });

    it("should display error message on failure to fetch project from store", () => {
      jest.spyOn(store, "select").mockReturnValue(throwError(() => "error"));

      component.ngOnInit();

      expect(component.isLoading).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should display error message on failure to get test definition ", () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValue(throwError(() => "error"));

      component.ngOnInit();

      expect(component.isLoading).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should display error message on failure to fetch repo ", () => {
      jest
        .spyOn(repositoryService, "getRepoById")
        .mockReturnValue(throwError(() => "error"));

      component.ngOnInit();

      expect(component.isLoading).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });
  });

  describe("isTestDefinitionTimeoutValid", () => {
    it("should return true if testDefinition and the timeout fields exists", () => {
      component.testDefinition = {
        timeoutDuration: {
          days: 1,
          hours: 1,
          minutes: 1,
        },
      } as TestDefinition;
      expect(component.isTestDefinitionTimeoutValid()).toBeTruthy();
    });

    it("should return false if testDefinition is not present", () => {
      component.testDefinition = null as unknown as TestDefinition;
      expect(component.isTestDefinitionTimeoutValid()).toBeFalsy();
    });

    it("should return false if timeoutDuration is not present", () => {
      component.testDefinition = {
        timeoutDuration: null,
      } as unknown as TestDefinition;
      expect(component.isTestDefinitionTimeoutValid()).toBeFalsy();
    });
  });

  describe("ngOnDestroy", () => {
    it("should complete the destroy subject", () => {
      const completeSpy = jest.spyOn(component["destroy$"], "complete");

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("reload test definition", () => {
    it("should reload test definition correctly", () => {
      component.isLoading = true;

      component.reloadTestDefinition();

      expect(component.isLoading).toBeFalsy();
      expect(component.testDefinition).toEqual(testDefinition);
    });
    it("should handle error correctly when reload test definition fails", () => {
      jest
        .spyOn(testDefinitionService, "fetch")
        .mockReturnValue(throwError(() => "error"));
      component.isLoading = true;

      component.reloadTestDefinition();

      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe("edit scenario definition", () => {
    beforeEach(() => {
      renderShowIfAuthorizedDirectives();
      fixture.detectChanges();
    });

    it("button should exist", () => {
      const editButton = fixture.debugElement.query(
        By.css("#edit-test-package")
      );
      expect(editButton).toBeTruthy();
    });

    it("button should be authorized", () => {
      const editButton = fixture.debugElement.query(
        By.css("#edit-test-package")
      );
      const showElementDirective = ngMocks.findInstance(
        editButton,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "update",
        attributes: {},
        package: "test",
        resource: "test_definition",
      });
    });
  });
});

function renderShowIfAuthorizedDirectives() {
  ngMocks
    .findInstances(ShowElementIfAuthorizedDirective)
    .forEach((authDirective) => ngMocks.render(authDirective, authDirective));
}
