import { of, take } from "rxjs";
import { ScenarioAddTestComponent } from "./scenario-add-test.component";
import { SelectChangeEvent } from "primeng/select";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockBuilder } from "ng-mocks";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";

describe("ScenarioAddTestComponent", () => {
  let component: ScenarioAddTestComponent;
  let testDefinitionService: jest.Mocked<TestDefinitionService>;
  let fixture: ComponentFixture<ScenarioAddTestComponent>;

  const PROJECT_ID = "TEST_PROJECT_ID";

  beforeEach(async () => {
    testDefinitionService = {
      fetchAll: jest.fn().mockReturnValue(of([getTestDefinitionsMockResult()])),
    } as unknown as jest.Mocked<TestDefinitionService>;

    await MockBuilder(ScenarioAddTestComponent).mock(
      TestDefinitionService,
      testDefinitionService
    );
    fixture = TestBed.createComponent(ScenarioAddTestComponent);
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
  });

  it("should fetch test definitions when modal is opened", () => {
    component.onOpenAddTestModal();
    expect(testDefinitionService.fetchAll).toHaveBeenCalledWith(PROJECT_ID);
    expect(component.form.controls.tags.disabled).toBeTruthy();
    expect(component.form.controls.testPackageSelections.disabled).toBeTruthy();

    component.testDefinitions$.pipe(take(1)).subscribe((result) => {
      expect(result).toEqual(getTestDefinitionsMockResult());
    });
  });

  it("should enable testPackageSelections and tags when testPackageDefinition is selected", () => {
    component.onTestDefinitionSelect({
      value: testDefinitionWithEmptyTestSelectionsMock,
    } as SelectChangeEvent);
    expect(component.form.controls.tags.enabled).toBeTruthy();
    expect(component.form.controls.testPackageSelections.enabled).toBeTruthy();
  });

  it("should init testPackageSelections and tags options when testPackageDefinition is selected", () => {
    component.onTestDefinitionSelect({
      value: testDefinitionWithTestSelectionsMock,
    } as SelectChangeEvent);
    expect(component.testSelectionOptions).toEqual([
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ]);
    expect(component.tagOptions).toEqual(["tag1", "tag2"]);
  });

  it("should disable testPackageSelections and tags when testPackageDefinition has no value", () => {
    component.form.controls.testPackageSelections.enable();
    component.form.controls.testPackageSelections.setValue([
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ]);
    component.form.controls.tags.enable();
    component.form.controls.tags.setValue(["tag1", "tag2"]);

    component.onTestDefinitionSelect({ value: null } as SelectChangeEvent);

    expect(component.form.controls.testPackageSelections.disabled).toBeTruthy();
    expect(component.form.controls.tags.disabled).toBeTruthy();
    expect(component.form.controls.tags.value).toEqual([]);
    expect(component.form.controls.testPackageSelections.value).toEqual([]);
  });

  it("should filter test selections options containing selected tag 1 and update form value", () => {
    component.form.controls.testPackageDefinition.setValue(
      testDefinitionWithTestSelectionsMock
    );

    component.testSelectionOptions = [
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ];
    component.onTagSelect({ value: ["tag1"] } as SelectChangeEvent);

    expect(component.testSelectionOptions).toEqual([
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ]);
  });

  it("should show all test selections options when no tag is selected", () => {
    component.form.controls.testPackageDefinition.setValue(
      testDefinitionWithTestSelectionsMock
    );

    component.testSelectionOptions = [
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ];
    component.onTagSelect({ value: [] } as SelectChangeEvent);

    expect(component.testSelectionOptions).toEqual([
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ]);
  });

  it("should filter test selections options containing selected tag 2 and update form value", () => {
    component.form.controls.testPackageDefinition.setValue(
      testDefinitionWithTestSelectionsMock
    );
    component.testSelectionOptions = [
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ];
    component.onTagSelect({ value: ["tag2"] } as SelectChangeEvent);

    expect(component.testSelectionOptions).toEqual([secondTestSelectionsMock]);
  });

  it("should remove selected test selections when removing it from options list after removing a tag", () => {
    component.form.controls.testPackageDefinition.setValue(
      testDefinitionWithTestSelectionsMock
    );
    component.form.controls.testPackageSelections.setValue([
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ]);

    component.testSelectionOptions = [
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ];
    component.onTagSelect({ value: ["tag2"] } as SelectChangeEvent);

    expect(component.form.controls.testPackageSelections.value).toEqual([
      secondTestSelectionsMock,
    ]);
  });

  it("should filter test selections options containing selected tag 1 and 2 and update form value", () => {
    component.form.controls.testPackageDefinition.setValue(
      testDefinitionWithTestSelectionsMock
    );
    component.testSelectionOptions = [
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ];
    component.onTagSelect({ value: ["tag1", "tag2"] } as SelectChangeEvent);

    expect(component.testSelectionOptions).toEqual([
      firstTestSelectionsMock,
      secondTestSelectionsMock,
    ]);
  });

  it("should submit test candidate with test selections", () => {
    component.form.controls.testPackageDefinition.setValue(
      testDefinitionWithTestSelectionsMock
    );
    component.form.controls.testPackageSelections.setValue([
      firstTestSelectionsMock,
    ]);
    const addTestCandidateSpy = jest.spyOn(component.addTestCandidate, "emit");
    const closeAddTestModalSpy = jest.spyOn(
      component.closeAddTestModal,
      "emit"
    );

    component.onSubmit();

    expect(addTestCandidateSpy).toHaveBeenCalledWith({
      full: false,
      testSelections: [firstTestSelectionsMock],
      testDefinition: testDefinitionWithTestSelectionsMock,
    });
    expect(closeAddTestModalSpy).toHaveBeenCalled();
  });

  it("should submit test candidate without test selections", () => {
    component.form.controls.testPackageDefinition.setValue(
      testDefinitionWithTestSelectionsMock
    );
    const addTestCandidateSpy = jest.spyOn(component.addTestCandidate, "emit");
    const closeAddTestModalSpy = jest.spyOn(
      component.closeAddTestModal,
      "emit"
    );

    component.onSubmit();

    expect(addTestCandidateSpy).toHaveBeenCalledWith({
      full: true,
      testSelections: [],
      testDefinition: testDefinitionWithTestSelectionsMock,
    });
    expect(closeAddTestModalSpy).toHaveBeenCalled();
  });

  it("should not submit test candidate if no test definition is selected", () => {
    const addTestCandidateSpy = jest.spyOn(component.addTestCandidate, "emit");
    const closeAddTestModalSpy = jest.spyOn(
      component.closeAddTestModal,
      "emit"
    );

    component.onSubmit();

    expect(addTestCandidateSpy).not.toHaveBeenCalled();
    expect(closeAddTestModalSpy).not.toHaveBeenCalled();
  });
});

const firstTestSelectionsMock: TestSelection = {
  id: "1",
  name: "Case 1",
  path: "",
  tags: ["tag1"],
};

const secondTestSelectionsMock: TestSelection = {
  id: "2",
  name: "Case 2",
  path: "",
  tags: ["tag2", "tag1"],
};

const testDefinitionWithEmptyTestSelectionsMock: TestDefinition = {
  id: "1",
  name: "Test 1",
  testSelections: [],
  projectId: "",
  repoId: "",
  path: "",
  timeoutDuration: {
    days: 0,
    hours: 0,
    minutes: 0,
  },
  description: "",
};

const testDefinitionWithTestSelectionsMock: TestDefinition = {
  id: "1",
  name: "Test 1",
  testSelections: [firstTestSelectionsMock, secondTestSelectionsMock],
  projectId: "",
  repoId: "",
  path: "",
  timeoutDuration: {
    days: 0,
    hours: 0,
    minutes: 0,
  },
  description: "",
};

function getTestDefinitionsMockResult(): TestDefinition[] {
  return [
    testDefinitionWithEmptyTestSelectionsMock,
    testDefinitionWithTestSelectionsMock,
  ];
}
