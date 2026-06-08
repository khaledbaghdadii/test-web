import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Store } from "@ngrx/store";
import { of, throwError } from "rxjs";
import { MockStore } from "@ngrx/store/testing";
import { TestDefinitionsTableComponent } from "./test-definitions-table.component";
import { TestDefinitionTableSearchPipe } from "./test-definition-table-search.pipe";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ButtonModule } from "primeng/button";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { MockDirectives, MockModule, ngMocks } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { TableModule } from "primeng/table";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition } from "@mxevolve/domains/test/model";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { provideRouter } from "@angular/router";
import { CardContainerModule } from "@mxflow/ui/container";

describe("TestDefinitionsTableComponent", () => {
  let component: TestDefinitionsTableComponent;
  let fixture: ComponentFixture<TestDefinitionsTableComponent>;
  let testDefinitionService: jest.Mocked<TestDefinitionService>;
  let store: Store;
  let toastMessageService: jest.Mocked<ToastMessageService>;

  const testDefinitionTableSearchPipeMock: jest.Mocked<TestDefinitionTableSearchPipe> =
    {
      transform: jest.fn().mockImplementation((value) => value),
      search: jest.fn().mockImplementation((value) => value),
    };
  const mockTestPackageDefinitions: TestDefinition[] = [
    {
      id: "1",
      name: "tpk1",
      projectId: "proj1",
      repoId: "repo1",
      path: "path1",
      timeoutDuration: {
        days: 0,
        hours: 0,
        minutes: 0,
      },
      testSelections: [],
      description: "description 1",
    },
    {
      id: "2",
      name: "tpk2",
      projectId: "proj2",
      repoId: "repo2",
      path: "path2",
      timeoutDuration: {
        days: 0,
        hours: 0,
        minutes: 0,
      },
      testSelections: [],
      description: "description 2",
    },
  ];

  beforeEach(async () => {
    store = {
      select: jest.fn(() => of("proj1")),
    } as unknown as Store;

    testDefinitionService = {
      fetchAll: jest.fn().mockReturnValue(of(mockTestPackageDefinitions)),
    } as unknown as jest.Mocked<TestDefinitionService>;

    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    await TestBed.configureTestingModule({
      imports: [
        TestDefinitionsTableComponent,
        TestDefinitionTableSearchPipe,
        ButtonModule,
        TableModule,
        MockDirectives(ShowElementIfAuthorizedDirective),
        MockModule(HeaderTitleModule),
        MockModule(CardContainerModule),
      ],
      providers: [
        { provide: TestDefinitionService, useValue: testDefinitionService },
        { provide: Store, useValue: store },
        { provide: ToastMessageService, useValue: toastMessageService },
        {
          provide: TestDefinitionTableSearchPipe,
          useValue: testDefinitionTableSearchPipeMock,
        },
        provideRouter([]),
      ],
    }).compileComponents();

    store = TestBed.inject<Store>(Store) as MockStore;
    fixture = TestBed.createComponent(TestDefinitionsTableComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should fetch test package definitions on init", () => {
      jest.spyOn(store, "select").mockReturnValue(of("testProjectId"));

      component.ngOnInit();

      expect(testDefinitionService.fetchAll).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
      expect(component.testDefinitions).toEqual(mockTestPackageDefinitions);
    });

    it("should display error message on failure to fetch project from store", () => {
      jest.spyOn(store, "select").mockReturnValue(throwError(() => "error"));

      component.ngOnInit();

      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
      expect(component.isLoading).toBeFalsy();
    });

    it("should display error message on failure to fetch test definitions", () => {
      jest.spyOn(store, "select").mockReturnValue(of("testProjectId"));
      jest
        .spyOn(testDefinitionService, "fetchAll")
        .mockReturnValue(throwError(() => "error"));

      component.ngOnInit();

      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe("ngOnDestroy", () => {
    it("should unsubscribe from observables on component destroy", () => {
      const unsubscribeSpy = jest.spyOn(component["destroy$"], "next");

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe("clearSearchInput", () => {
    it("should clear search input", () => {
      component.searchInput = "scenario1";

      component.clearSearchInput();

      expect(component.searchInput).toBe("");
    });
  });

  describe("create test package definition", () => {
    beforeEach(() => {
      renderShowIfAuthorizedDirectives();
      fixture.detectChanges();
    });

    it("button should exist", () => {
      const button = fixture.debugElement.query(
        By.css("#create-test-definition-btn")
      );
      expect(button).toBeTruthy();
    });

    it("button should be authorized", () => {
      const button = fixture.debugElement.query(
        By.css("#create-test-definition-btn")
      );
      const showElementDirective = ngMocks.findInstance(
        button,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "create",
        attributes: {},
        package: "test",
        resource: "test_definition",
      });
    });
  });

  describe("edit test package definition", () => {
    beforeEach(() => {
      component.testDefinitions = mockTestPackageDefinitions;
      fixture.detectChanges();
      renderShowIfAuthorizedDirectives();
    });

    it("button should exist", () => {
      const button = fixture.debugElement.query(
        By.css("#edit-test-package-definition-btn")
      );
      expect(button).toBeTruthy();
    });

    it("button should be authorized", () => {
      const button = fixture.debugElement.query(
        By.css("#edit-test-package-definition-btn")
      );
      const showElementDirective = ngMocks.findInstance(
        button,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "update",
        attributes: {},
        package: "test",
        resource: "test_definition",
      });
    });

    it("button loading should be authorized", () => {
      fixture.componentInstance.isLoading = true;
      fixture.detectChanges();
      renderShowIfAuthorizedDirectives();

      const showElementDirective = ngMocks.findInstance(
        fixture.debugElement.query(By.css("#loadingEdit")),
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
  const showElementIfAuthorizedDirectives = ngMocks.findInstances(
    ShowElementIfAuthorizedDirective
  );
  showElementIfAuthorizedDirectives.forEach((authDirective) =>
    ngMocks.render(authDirective, authDirective)
  );
}
