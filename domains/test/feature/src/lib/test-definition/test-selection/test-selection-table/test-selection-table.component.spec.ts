import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestSelectionTableComponent } from "./test-selection-table.component";
import { ConfirmationService } from "primeng/api";
import { TableModule } from "primeng/table";
import { of, throwError } from "rxjs";
import { By } from "@angular/platform-browser";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { MockComponents, MockDirectives, MockModule, ngMocks } from "ng-mocks";
import { ButtonModule } from "primeng/button";
import { SplitButtonModule } from "primeng/splitbutton";
import { ProjectService } from "@mxflow/features/project";
import { DomTestUtils } from "@mxevolve/testing";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";
import { AddTestSelectionFormComponent } from "../add-test-selection-form/add-test-selection-form.component";
import { EditTestSelectionFormComponent } from "../edit-test-selection-form/edit-test-selection-form.component";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  MXEvolveShowMoreLessModule,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { ConfirmPopup } from "primeng/confirmpopup";
import { AddTestSelectionWithTagsModalComponent } from "../add-test-selections-with-tags-modal/add-test-selections-with-tags-modal.component";
import { SkeletonModule } from "primeng/skeleton";

describe("Test Selection Table", () => {
  let fixture: ComponentFixture<TestSelectionTableComponent>;
  let component: TestSelectionTableComponent;
  let testDefinitionService: jest.Mocked<TestDefinitionService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let confirmationService: any;
  let projectService: ProjectService;
  const projectId = "projectId";
  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    confirmationService = {
      confirm: jest.fn(),
    };

    projectService = {
      getFeatureToggle: jest.fn(() =>
        of({
          id: "test-tags",
          toggledOn: false,
        })
      ),
    } as unknown as ProjectService;

    testDefinitionService = {
      removeTestSelectionFromTestDefinition: jest.fn(),
      deleteAllTestSelections: jest.fn(() => of({})),
    } as unknown as jest.Mocked<TestDefinitionService>;

    TestBed.configureTestingModule({
      imports: [
        TestSelectionTableComponent,
        TableModule,
        ButtonModule,
        SplitButtonModule,
        SkeletonModule,
        MockComponents(
          AddTestSelectionFormComponent,
          EditTestSelectionFormComponent,
          AddTestSelectionWithTagsModalComponent,
          TableEmptyMessageComponent,
          ConfirmPopup
        ),
        MockDirectives(ShowElementIfAuthorizedDirective),
        MockModule(HeaderTitleModule),
        MockModule(MXEvolveShowMoreLessModule),
      ],
      providers: [
        { provide: ProjectService, useValue: projectService },
        { provide: TestDefinitionService, useValue: testDefinitionService },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: ConfirmationService, useValue: confirmationService },
      ],
    });

    fixture = TestBed.createComponent(TestSelectionTableComponent);
    component = fixture.componentInstance;
    component.testDefinition = {
      id: "some_id",
      testSelections: [],
    } as unknown as TestDefinition;
    component.projectId = projectId;
    fixture.detectChanges();
  });

  describe("on init", () => {
    it("should call project service to get feature flag on init", () => {
      expect(projectService.getFeatureToggle).toHaveBeenCalledWith(
        projectId,
        "test-tags"
      );
    });

    it("should set isUserAbleToSeeAddTestSelectionsWithTagsButton to true if test tags feature flag is on", () => {
      jest.spyOn(projectService, "getFeatureToggle").mockReturnValue(
        of({
          id: "test-tags",
          toggledOn: true,
        })
      );

      fixture = TestBed.createComponent(TestSelectionTableComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isTestSelectionTagsFeatureEnabled).toBeTruthy();
    });
  });

  describe("deleteTestSelection", () => {
    it("should delete a test selection and stop loading ", () => {
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;
      component.testDefinition = {
        id: "some_other_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;
      jest
        .spyOn(testDefinitionService, "removeTestSelectionFromTestDefinition")
        .mockReturnValue(of(undefined));
      component.deleteTestSelection("some_id");
      expect(component.testDefinition.testSelections).toEqual([]);
      expect(component.isLoading).toBeFalsy();
    });

    it("should display success message on successful delete", () => {
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;
      component.testDefinition = {
        id: "some_other_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;
      jest
        .spyOn(testDefinitionService, "removeTestSelectionFromTestDefinition")
        .mockReturnValue(of(undefined));
      component.deleteTestSelection("some_id");
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Test Selection deleted Successfully!"
      );
    });

    it("should throw an error when deletion fails ", () => {
      const testSelection = {
        id: "some_id",
      } as unknown as TestSelection;
      component.testDefinition = {
        id: "some_other_id",
        testSelections: [testSelection],
      } as unknown as TestDefinition;
      jest
        .spyOn(testDefinitionService, "removeTestSelectionFromTestDefinition")
        .mockReturnValue(throwError(() => "error"));
      component.deleteTestSelection("some_id");
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe("openAddTestSelectionModal", () => {
    beforeEach(() => {
      renderShowIfAuthorizedDirectives();
      fixture.detectChanges();
    });

    it("should open the add test selection modal", () => {
      component.openAddTestSelectionModal();
      expect(component.isAddTestSelectionOpen).toBeTruthy();
    });

    it("should call openAddTestSelectionModal when add button is clicked", () => {
      const onSubmitSpy = jest.spyOn(component, "openAddTestSelectionModal");
      getButtonHarness("add-test-selection-form-button").click();
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });

    it("button should be authorized", () => {
      const addTestSelectionButton = fixture.debugElement.query(
        By.css('[data-testid="add-test-selection-form-button"]')
      );
      const showElementDirective = ngMocks.findInstance(
        addTestSelectionButton,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "update",
        attributes: {},
        package: "test",
        resource: "test_selection",
      });
    });
  });

  describe("ngOnDestroy", () => {
    it("should complete the destroy subject", () => {
      const completeSpy = jest.spyOn(component["destroy$"], "complete");

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("openEditTestSelectionModal", () => {
    beforeEach(() => {
      component.testDefinition.testSelections = [
        {
          id: "some_id",
          path: "some_path",
          name: "some_name",
          tags: ["tag1"],
        },
      ];
      fixture.detectChanges();
      renderShowIfAuthorizedDirectives();
      fixture.detectChanges();
    });

    it("should open the edit test selection modal", () => {
      const testSelection = {
        id: "some_id",
        path: "some_path",
        name: "some_name",
        tags: ["tag1"],
      };
      component.openEditTestSelectionModal(testSelection);
      expect(component.isEditTestSelectionOpen).toBeTruthy();
      expect(component.testSelectiontoEdit).toEqual(testSelection);
    });

    it("should call openEditTestSelectionModal when edit button is clicked", () => {
      const onSubmitSpy = jest.spyOn(component, "openEditTestSelectionModal");
      getButtonHarness("edit-test-selection-form-button").click();

      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });

    it("button should be authorized", () => {
      const editTestSelectionButton = fixture.debugElement.query(
        By.css('[data-testid="edit-test-selection-form-button"]')
      );
      const showElementDirective = ngMocks.findInstance(
        editTestSelectionButton,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "update",
        attributes: {},
        package: "test",
        resource: "test_selection",
      });
    });
  });

  describe("onRemoveTestSelection", () => {
    beforeEach(() => {
      component.testDefinition.testSelections = [
        {
          id: "some_id",
          path: "some_path",
          name: "some_name",
          tags: ["tag1"],
        },
      ];
      fixture.detectChanges();
      renderShowIfAuthorizedDirectives();
    });

    it("should open the deletion confirmation", () => {
      const confirmationServiceSpy = jest.spyOn(confirmationService, "confirm");
      getButtonHarness("delete-test-selections-button").click();
      expect(confirmationServiceSpy).toHaveBeenCalled();
    });

    it("button should be authorized", () => {
      const editTestSelectionButton = fixture.debugElement.query(
        By.css('[data-testid="delete-test-selection-form-button"]')
      );
      const showElementDirective = ngMocks.findInstance(
        editTestSelectionButton,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "delete",
        attributes: {},
        package: "test",
        resource: "test_selection",
      });
    });

    it("loading delete button should be authorized", () => {
      fixture.componentInstance.isLoading = true;
      fixture.detectChanges();
      renderShowIfAuthorizedDirectives();
      const loadingDeleteTestSelectionButton = fixture.debugElement.query(
        By.css("#loadingTestSelectionsEdit")
      );
      const showElementDirective = ngMocks.findInstance(
        loadingDeleteTestSelectionButton,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "delete",
        attributes: {},
        package: "test",
        resource: "test_selection",
      });
    });
  });

  describe("delete all test selections in a test definition", () => {
    it("confirm delete all calls the confirmation service with the correct params", () => {
      const event = {} as MouseEvent;
      component.confirmDeleteAll(event);
      expect(confirmationService.confirm).toHaveBeenCalledWith({
        target: event.target,
        message:
          "Are you sure you want to delete all test selections under this test definition?",
        icon: "pi pi-info-circle",
        accept: expect.any(Function),
      });
    });
    it("upon confirming the delete all popup, the correct method should be called", () => {
      const event = {} as MouseEvent;
      component.isLoading = false;
      component.deleteAllTestSelections = jest.fn();
      component.confirmDeleteAll(event);
      confirmationService.confirm.mock.calls[0][0].accept();
      expect(component.deleteAllTestSelections).toHaveBeenCalled();
      expect(component.isLoading).toBeTruthy();
    });
    it("delete all test selections should delegate deleting the test selections to the test definition service", () => {
      component.deleteAllTestSelections();
      expect(
        testDefinitionService.deleteAllTestSelections
      ).toHaveBeenCalledWith(projectId, component.testDefinition.id);
    });
    it("delete all test selections should reset the list of test selections to empty list upon successful deletion", () => {
      component.testDefinition.testSelections = [
        { id: "1" } as unknown as TestSelection,
      ];
      component.deleteAllTestSelections();
      expect(component.testDefinition.testSelections).toEqual([]);
    });
    it("should show a success toast if deleting all test selections is successful", () => {
      component.deleteAllTestSelections();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "All test selections under this test definition were deleted successfully"
      );
    });
    it("should show error toast in case of error", () => {
      testDefinitionService.deleteAllTestSelections.mockReturnValue(
        throwError(() => "error")
      );
      component.deleteAllTestSelections();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });
    it("should set isLoading to false in case of successful deletion", () => {
      component.isLoading = true;
      component.deleteAllTestSelections();
      expect(component.isLoading).toBeFalsy();
    });
    it("should set isLoading to false in case of failing to delete", () => {
      testDefinitionService.deleteAllTestSelections.mockReturnValue(
        throwError(() => "error")
      );
      component.isLoading = true;
      component.deleteAllTestSelections();
      expect(component.isLoading).toBeFalsy();
    });
    describe("template tests", () => {
      beforeEach(() => {
        fixture.detectChanges();
        renderShowIfAuthorizedDirectives();
      });
      it("button should be authorized", () => {
        const deleteAllTestSelectionsButton = fixture.debugElement.query(
          By.css('[data-testid="delete-test-selections-button"]')
        );
        const showElementDirective = ngMocks.findInstance(
          deleteAllTestSelectionsButton,
          ShowElementIfAuthorizedDirective
        );
        expect(showElementDirective.showElementIfAuthorized).toEqual({
          action: "delete",
          attributes: {},
          package: "test",
          resource: "test_selection",
        });
      });
      it("the button should be enabled if there are test selections in the test definition and the page is done loading", () => {
        component.isLoading = false;
        component.testDefinition.testSelections = [
          { id: "1" } as unknown as TestSelection,
        ];
        expect(
          getButtonHarness("delete-test-selections-button").isDisabled()
        ).toBeFalsy();
      });
      it("should disable the button in case the component is loading", () => {
        component.isLoading = true;
        component.testDefinition.testSelections = [
          { id: "1" } as unknown as TestSelection,
        ];
        expect(
          getButtonHarness("delete-test-selections-button").isDisabled()
        ).toBeTruthy();
      });
      it("should disable the delete all button in case the component id done loading but the test definition does not have test selections", () => {
        component.isLoading = false;
        component.testDefinition.testSelections = [];
        expect(
          getButtonHarness("delete-test-selections-button").isDisabled()
        ).toBeTruthy();
      });
      it("should call confirm delete all method when the delete all test selections button is clicked", () => {
        component.isLoading = false;
        component.testDefinition.testSelections = [
          { id: "1" } as unknown as TestSelection,
        ];
        jest.spyOn(component, "confirmDeleteAll");

        getButtonHarness("delete-test-selections-button").click();
        expect(component.confirmDeleteAll).toHaveBeenCalled();
      });
    });
  });

  it("should open test selection modal correctly", () => {
    component.isAddTestSelectionsWithTagsOpen = false;

    component.openAddTestSelectionWithTagsModal();

    expect(component.isAddTestSelectionsWithTagsOpen).toBeTruthy();
  });

  it("should emit and event to refresh the test selections when test selections are added", () => {
    const emitSpy = jest.spyOn(component.reloadTestDefinition, "emit");

    component.handleAddedTestSelections();

    expect(emitSpy).toHaveBeenCalled();
  });

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }
});

function renderShowIfAuthorizedDirectives() {
  const showElementIfAuthorizedDirectives = ngMocks.findInstances(
    ShowElementIfAuthorizedDirective
  );
  showElementIfAuthorizedDirectives.forEach((authDirective) =>
    ngMocks.render(authDirective, authDirective)
  );
}
