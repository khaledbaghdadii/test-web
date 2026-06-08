import { AddTestSelectionWithTagsModalComponent } from "./add-test-selections-with-tags-modal.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfirmationService } from "primeng/api";
import { TestSelectionDuplicateUtilsService } from "./test-selection-duplicate-utils.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { of, throwError } from "rxjs";
import { Popover } from "primeng/popover";
import { MockPipe } from "ng-mocks";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestSelectionDuplicateExistsPipe } from "./test-selection-duplicate-exists.pipe";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestSelection, TestDefinition } from "@mxevolve/domains/test/model";

describe("Add TestSelection with tags modal component", () => {
  let component: AddTestSelectionWithTagsModalComponent;
  let fixture: ComponentFixture<AddTestSelectionWithTagsModalComponent>;
  let testDefinitionService: TestDefinitionService;
  let toastMessageService: ToastMessageService;
  let confirmationService: ConfirmationService;
  let utilsService: TestSelectionDuplicateUtilsService;
  const projectId = "projectId";
  const testDefinitionId = "testDefinitionId";
  const defaultBranch = "defaultBranch";

  beforeEach(() => {
    testDefinitionService = {
      fetch: jest.fn(),
      fetchTestSelectionsFromContextConfig: jest.fn(),
      bulkAddTestSelections: jest.fn(),
    } as unknown as TestDefinitionService;

    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;

    confirmationService = {
      confirm: jest.fn(),
    } as unknown as ConfirmationService;

    utilsService = {
      mergeTestSelectionsWithDuplicatePaths: jest.fn(),
      noDuplicateNamesValidator: jest.fn(),
      transformToTestSelections: jest.fn(),
    } as unknown as TestSelectionDuplicateUtilsService;

    TestBed.configureTestingModule({
      imports: [
        AddTestSelectionWithTagsModalComponent,
        MockPipe(TestSelectionDuplicateExistsPipe),
      ],
      providers: [
        { provide: TestDefinitionService, useValue: testDefinitionService },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: ConfirmationService, useValue: confirmationService },
        {
          provide: TestSelectionDuplicateUtilsService,
          useValue: utilsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTestSelectionWithTagsModalComponent);
    component = fixture.componentInstance;
    component.projectId = projectId;
    component.testDefinitionId = testDefinitionId;
    component.defaultBranch = defaultBranch;
  });

  it("should should init the form with empty stings and conflict message with its value correctly", () => {
    expect(component.testSelectionEditForm.controls.id.value).toEqual("");
    expect(component.testSelectionEditForm.controls.name.value).toEqual("");
    expect(
      component.testSelectionEditForm.controls.name.hasValidator(
        Validators.required
      )
    ).toBeTruthy();
    expect(
      component.testSelectionEditForm.controls.name.hasValidator(
        WhitespaceValidators.notBlank()
      )
    ).toBeTruthy();
  });

  it("should load data when the modal is visible is changed to true", () => {
    const loadDataSpy = jest.spyOn(component, "loadData");

    component.isModalVisible = true;

    expect(loadDataSpy).toHaveBeenCalled();
  });

  it("should load test definition and test selections from context file and merge duplicates and init existing and test selections array", () => {
    component.isLoading = true;
    component.submitButtonLoading = true;
    const fetchTestDefinitionSpy = jest.spyOn(testDefinitionService, "fetch");
    const fetchTestSelectionsFromContextConfigSpy = jest.spyOn(
      testDefinitionService,
      "fetchTestSelectionsFromContextConfig"
    );
    const mergeTestSelectionsWithDuplicatePathsSpy = jest.spyOn(
      utilsService,
      "mergeTestSelectionsWithDuplicatePaths"
    );

    const transformToTestSelectionsSpy = jest.spyOn(
      utilsService,
      "transformToTestSelections"
    );

    transformToTestSelectionsSpy.mockReturnValue([
      testSelection,
      secondTestSelection,
    ]);

    fetchTestDefinitionSpy.mockReturnValue(of(testDefinition));
    fetchTestSelectionsFromContextConfigSpy.mockReturnValue(
      of([preconfiguredTestSelection, secondPreconfiguredTestSelection])
    );

    mergeTestSelectionsWithDuplicatePathsSpy.mockReturnValue([
      testSelection,
      secondTestSelection,
    ]);

    component.loadData();

    expect(fetchTestDefinitionSpy).toHaveBeenCalledWith(
      testDefinitionId,
      projectId
    );
    expect(transformToTestSelectionsSpy).toHaveBeenCalledWith([
      preconfiguredTestSelection,
      secondPreconfiguredTestSelection,
    ]);
    expect(fetchTestSelectionsFromContextConfigSpy).toHaveBeenCalledWith(
      testDefinitionId,
      projectId,
      defaultBranch
    );
    expect(mergeTestSelectionsWithDuplicatePathsSpy).toHaveBeenCalledWith(
      [thirdTestSelection],
      [testSelection, secondTestSelection]
    );

    expect(component.isLoading).toBeFalsy();
    expect(component.submitButtonLoading).toBeFalsy();
    expect(component.testSelectionsToAdd).toEqual([
      testSelection,
      secondTestSelection,
    ]);
    expect(component.existingTestSelections).toEqual([thirdTestSelection]);
  });

  it("should handle error when fetch test definition fail when loading data correctly", () => {
    component.isLoading = true;
    component.submitButtonLoading = true;
    const fetchTestDefinitionSpy = jest.spyOn(testDefinitionService, "fetch");
    const fetchTestSelectionsFromContextConfigSpy = jest.spyOn(
      testDefinitionService,
      "fetchTestSelectionsFromContextConfig"
    );

    fetchTestDefinitionSpy.mockReturnValue(throwError(() => "error"));
    fetchTestSelectionsFromContextConfigSpy.mockReturnValue(
      of([testSelection, secondTestSelection])
    );

    component.loadData();

    expect(fetchTestDefinitionSpy).toHaveBeenCalledWith(
      testDefinitionId,
      projectId
    );
    expect(fetchTestSelectionsFromContextConfigSpy).toHaveBeenCalledWith(
      testDefinitionId,
      projectId,
      defaultBranch
    );
    expect(
      utilsService.mergeTestSelectionsWithDuplicatePaths
    ).not.toHaveBeenCalled();
    expect(component.testSelectionsToAdd).toEqual([]);
    expect(component.existingTestSelections).toEqual([]);
    expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    expect(component.isLoading).toBeFalsy();
    expect(component.submitButtonLoading).toBeFalsy();
  });

  it("should handle error when fetch test selections from context file fail when loading data correctly", () => {
    const fetchTestDefinitionSpy = jest.spyOn(testDefinitionService, "fetch");
    const fetchTestSelectionsFromContextConfigSpy = jest.spyOn(
      testDefinitionService,
      "fetchTestSelectionsFromContextConfig"
    );

    fetchTestDefinitionSpy.mockReturnValue(of(testDefinition));
    fetchTestSelectionsFromContextConfigSpy.mockReturnValue(
      throwError(() => "error")
    );

    component.loadData();

    expect(fetchTestDefinitionSpy).toHaveBeenCalledWith(
      testDefinitionId,
      projectId
    );
    expect(fetchTestSelectionsFromContextConfigSpy).toHaveBeenCalledWith(
      testDefinitionId,
      projectId,
      defaultBranch
    );
    expect(
      utilsService.mergeTestSelectionsWithDuplicatePaths
    ).not.toHaveBeenCalled();
    expect(component.testSelectionsToAdd).toEqual([]);
    expect(component.existingTestSelections).toEqual([]);
    expect(toastMessageService.showError).toHaveBeenCalledWith("error");
  });

  it("should submit data and call services correctly", () => {
    component.submitButtonLoading = true;
    component.testSelectionsToAdd = [testSelection, secondTestSelection];
    const bulkAddTestSelectionsSpy = jest.spyOn(
      testDefinitionService,
      "bulkAddTestSelections"
    );
    const modalVisibleEventEmitterSpy = jest.spyOn(
      component.isModalVisibleChange,
      "emit"
    );
    const addedTestSelectionsEventEmitterSpy = jest.spyOn(
      component.addedTestSelections,
      "emit"
    );

    bulkAddTestSelectionsSpy.mockReturnValue(
      of([testSelection, secondTestSelection])
    );

    component.onSubmit();

    expect(bulkAddTestSelectionsSpy).toHaveBeenCalledWith(
      projectId,
      testDefinitionId,
      [testSelection, secondTestSelection]
    );
    expect(addedTestSelectionsEventEmitterSpy).toHaveBeenCalledWith([
      testSelection,
      secondTestSelection,
    ]);
    expect(modalVisibleEventEmitterSpy).toHaveBeenCalledWith(false);
    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "Test selections successfully added"
    );
    expect(component.submitButtonLoading).toBeFalsy();
  });

  it("should handle error when submitting data correctly", () => {
    component.testSelectionsToAdd = [testSelection, secondTestSelection];
    const bulkAddTestSelectionsSpy = jest.spyOn(
      testDefinitionService,
      "bulkAddTestSelections"
    );
    const modalVisibleEventEmitterSpy = jest.spyOn(
      component.isModalVisibleChange,
      "emit"
    );
    const addedTestSelectionsEventEmitterSpy = jest.spyOn(
      component.addedTestSelections,
      "emit"
    );

    bulkAddTestSelectionsSpy.mockReturnValue(throwError(() => "error"));

    component.onSubmit();

    expect(bulkAddTestSelectionsSpy).toHaveBeenCalledWith(
      projectId,
      testDefinitionId,
      [testSelection, secondTestSelection]
    );
    expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    expect(addedTestSelectionsEventEmitterSpy).not.toHaveBeenCalled();
    expect(modalVisibleEventEmitterSpy).not.toHaveBeenCalled();
  });

  it("should confirm deletion of test selection correctly", () => {
    const eventMock = { target: {} } as MouseEvent;

    component.deleteTestSelection(eventMock, "id");

    expect(confirmationService.confirm).toHaveBeenCalledWith({
      target: eventMock.target,
      message: "Are you sure you want to delete this test selection?",
      icon: "pi pi-info-circle",
      acceptButtonStyleClass: "p-button-info p-button-sm ml-2",
      accept: expect.any(Function),
    });
  });

  it("should show edit form panel and populate form correctly", () => {
    component.testSelectionsToAdd = [testSelection];
    component.existingTestSelections = [secondTestSelection];
    const eventMock = {} as Event;
    const popoverMock = { toggle: jest.fn() } as unknown as Popover;
    const popoverSpy = jest.spyOn(popoverMock, "toggle");
    const addValidatorSpy = jest.spyOn(
      component.testSelectionEditForm.controls.name,
      "addValidators"
    );

    const noDuplicateNamesValidatorSpy = jest.spyOn(
      utilsService,
      "noDuplicateNamesValidator"
    );
    component.showEditFormPanel(eventMock, popoverMock, "id");

    expect(component.testSelectionEditForm.controls.id.value).toBe("id");
    expect(component.testSelectionEditForm.controls.name.value).toBe("name");
    expect(addValidatorSpy).toHaveBeenCalledWith(
      utilsService.noDuplicateNamesValidator(
        [secondTestSelection],
        [testSelection]
      )
    );

    expect(noDuplicateNamesValidatorSpy).toHaveBeenCalledWith(
      [secondTestSelection],
      [testSelection]
    );

    expect(popoverSpy).toHaveBeenCalledWith(eventMock);
  });

  it("should not show edit form panel if test does not exist", () => {
    const eventMock = {} as Event;
    const popoverMock = { toggle: jest.fn() } as unknown as Popover;
    const popoverSpy = jest.spyOn(popoverMock, "toggle");
    const noDuplicateNamesValidatorSpy = jest.spyOn(
      utilsService,
      "noDuplicateNamesValidator"
    );

    component.showEditFormPanel(eventMock, popoverMock, "id");

    expect(noDuplicateNamesValidatorSpy).not.toHaveBeenCalled();
    expect(popoverSpy).not.toHaveBeenCalled();
  });

  it("should reset form when showing edit form panel", () => {
    component.testSelectionsToAdd = [testSelection];
    component.existingTestSelections = [secondTestSelection];
    const eventMock = {} as Event;
    const popoverMock = { toggle: jest.fn() } as unknown as Popover;
    const resetFormSpy = jest.spyOn(component.testSelectionEditForm, "reset");

    component.showEditFormPanel(eventMock, popoverMock, "id");

    expect(resetFormSpy).toHaveBeenCalled();
  });

  it("should submit edit test selection correctly", () => {
    const popover = { hide: jest.fn() } as unknown as Popover;
    const popoverSpy = jest.spyOn(popover, "hide");
    component.testSelectionEditForm = new FormGroup({
      name: new FormControl<string>("new_name"),
      id: new FormControl<string>("id"),
    });
    component.testSelectionsToAdd = [testSelection];
    component.submitEditTestSelection(popover);

    expect(component.testSelectionsToAdd).toEqual([
      {
        id: "id",
        name: "new_name",
        path: "path",
        tags: ["tags"],
      },
    ]);

    expect(popoverSpy).toHaveBeenCalled();
  });

  it("should not update test selection and hide panel if form is not valid", () => {
    const popover = { hide: jest.fn() } as unknown as Popover;
    const popoverSpy = jest.spyOn(popover, "hide");
    component.testSelectionEditForm = new FormGroup({
      name: new FormControl<string | null>(null, Validators.required),
      id: new FormControl<string | null>(null, Validators.required),
    });
    component.testSelectionsToAdd = [testSelection];
    component.submitEditTestSelection(popover);

    expect(component.testSelectionsToAdd).toEqual([
      {
        id: "id",
        name: "name",
        path: "path",
        tags: ["tags"],
      },
    ]);

    expect(popoverSpy).not.toHaveBeenCalled();
  });

  it("should close modal and initialize test selections to empty correctly", () => {
    const modalVisibleEventEmitterSpy = jest.spyOn(
      component.isModalVisibleChange,
      "emit"
    );
    component.testSelectionsToAdd = [testSelection];
    component.existingTestSelections = [testSelection];

    component.closeModal();

    expect(modalVisibleEventEmitterSpy).toHaveBeenCalledWith(false);
    expect(component.testSelectionsToAdd).toEqual([]);
    expect(component.testSelectionsToAdd).toEqual([]);
  });
});

const testSelection: TestSelection = {
  id: "id",
  name: "name",
  path: "path",
  tags: ["tags"],
};

const secondTestSelection: TestSelection = {
  id: "id2",
  name: "name2",
  path: "path2",
  tags: ["tags2"],
};

const preconfiguredTestSelection: TestSelection = {
  id: "id",
  name: "name",
  path: "path",
  tags: ["tags"],
};

const secondPreconfiguredTestSelection: TestSelection = {
  id: "id2",
  name: "name2",
  path: "path2",
  tags: ["tags2"],
};

const thirdTestSelection: TestSelection = {
  id: "id3",
  name: "name3",
  path: "path3",
  tags: ["tags3"],
};

const testDefinition: TestDefinition = {
  id: "id1",
  name: "name1",
  projectId: "projectId",
  repoId: "repoId",
  path: "path",
  timeoutDuration: {
    days: 1,
    hours: 2,
    minutes: 3,
  },
  testSelections: [thirdTestSelection],
  description: "description",
};
