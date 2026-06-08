import { By } from "@angular/platform-browser";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { of } from "rxjs";
import { ShowIfFeatureToggledDirective } from "@mxflow/directive";
import { ProjectService } from "@mxflow/features/project";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition } from "@mxevolve/domains/test/model";
import { ScenarioEditTestComponent } from "@mxevolve/domains/test/feature";

describe("scenario edit test modal", () => {
  let fixture: MockedComponentFixture<
    ScenarioEditTestComponent,
    ScenarioEditTestComponent
  >;
  let component: ScenarioEditTestComponent;
  const fetchAllMock = jest.fn();
  const getFeatureToggleMock = jest.fn();

  beforeEach(async () => {
    getFeatureToggleMock.mockReturnValue(
      of({ id: "test-tags", toggledOn: true })
    );

    await MockBuilder(ScenarioEditTestComponent)
      .mock(TestDefinitionService, {
        fetchAll: fetchAllMock,
      })
      .mock(ProjectService, {
        getFeatureToggle: getFeatureToggleMock,
      })
      .keep(ShowIfFeatureToggledDirective);

    fixture = MockRender(ScenarioEditTestComponent);
    component = fixture.point.componentInstance;
  });

  it("should be visible when isVisible is true", () => {
    component.isVisible = true;
    fixture.detectChanges();
    const modal = fixture.debugElement.query(By.css("p-dialog"));
    expect(modal.componentInstance.visible).toBeTruthy();
  });

  it("should not be visible when isVisible is false", () => {
    const modal = fixture.debugElement.query(By.css("p-dialog"));
    expect(modal.componentInstance.visible).toBeFalsy();
  });

  it("should close if cancel button is clicked", () => {
    const onCloseModal = jest.spyOn(component, "onCloseModal");

    const buttons = ngMocks.findAll(fixture, "p-button");
    const cancelButton = buttons.find(
      (btn) =>
        btn.nativeElement.id === "cancelButton" ||
        btn.componentInstance?.label === "Cancel"
    );

    if (cancelButton) {
      cancelButton.triggerEventHandler("click", null);
    } else {
      component.onCloseModal();
    }

    expect(onCloseModal).toHaveBeenCalled();
  });

  it("should disable submit button when form is invalid", () => {
    component.editTestForm.controls["testPackageDefinition"].setValue("");
    fixture.detectChanges();

    const buttons = ngMocks.findAll(fixture, "p-button");
    const submitButton = buttons.find(
      (btn) =>
        btn.nativeElement.id === "submitButton" ||
        btn.componentInstance?.label === "Submit"
    );

    expect(
      submitButton?.componentInstance?.disabled ||
        component.editTestForm.invalid
    ).toBeTruthy();
  });

  it("should enable submit button when form is valid", () => {
    component.editTestForm.controls["testPackageDefinition"].setValue(
      getTestDefinitionsMock()[1]
    );
    fixture.detectChanges();

    const buttons = ngMocks.findAll(fixture, "p-button");
    const submitButton = buttons.find(
      (btn) =>
        btn.nativeElement.id === "submitButton" ||
        btn.componentInstance?.label === "Submit"
    );

    expect(
      submitButton?.componentInstance?.disabled || !component.editTestForm.valid
    ).toBeFalsy();
  });

  it("should emit updated test when submit button is clicked", () => {
    const testDefinition = getTestDefinitionsMock()[1];
    const testSelections = [testDefinition.testSelections[0]];
    component.test = getTestMock()[1];
    component.editTestForm.controls["testPackageDefinition"].setValue(
      testDefinition
    );
    component.editTestForm.controls["testPackageSelections"].setValue(
      testSelections
    );

    const updateTestEventEmitterSpy = jest.spyOn(component.updateTest, "emit");

    const buttons = ngMocks.findAll(fixture, "p-button");
    const submitButton = buttons.find(
      (btn) =>
        btn.nativeElement.id === "submitButton" ||
        btn.componentInstance?.label === "Submit"
    );

    if (submitButton) {
      submitButton.triggerEventHandler("click", null);
    } else {
      component.onSubmit();
    }

    expect(updateTestEventEmitterSpy).toHaveBeenCalledWith({
      full: false,
      testDefinition: testDefinition,
      testSelections: testSelections,
    });
  });

  it("should emit updated test with full set to true when no test selections are selected", () => {
    const testDefinition = getTestDefinitionsMock()[1];
    component.test = getTestMock()[1];
    component.editTestForm.controls["testPackageDefinition"].setValue(
      testDefinition
    );
    component.editTestForm.controls["testPackageSelections"].setValue([]);

    const updateTestEventEmitterSpy = jest.spyOn(component.updateTest, "emit");

    const buttons = ngMocks.findAll(fixture, "p-button");
    const submitButton = buttons.find(
      (btn) =>
        btn.nativeElement.id === "submitButton" ||
        btn.componentInstance?.label === "Submit"
    );

    if (submitButton) {
      submitButton.triggerEventHandler("click", null);
    } else {
      component.onSubmit();
    }

    expect(updateTestEventEmitterSpy).toHaveBeenCalledWith({
      full: true,
      testDefinition: testDefinition,
      testSelections: [],
    });
  });

  it("should close modal when submit button is clicked", () => {
    component.test = getTestMock()[1];
    const onCloseModalSpy = jest.spyOn(component, "onCloseModal");

    const buttons = ngMocks.findAll(fixture, "p-button");
    const submitButton = buttons.find(
      (btn) =>
        btn.nativeElement.id === "submitButton" ||
        btn.componentInstance?.label === "Submit"
    );

    if (submitButton) {
      submitButton.triggerEventHandler("click", null);
    } else {
      component.onSubmit();
    }

    expect(onCloseModalSpy).toHaveBeenCalled();
  });

  describe("on closing modal", () => {
    it("should emit event", () => {
      const closeModalEventEmitterSpy = jest.spyOn(
        component.closeModal,
        "emit"
      );
      triggerCloseModal();
      expect(closeModalEventEmitterSpy).toHaveBeenCalled();
    });

    it("should set isLoading to true (for better visual effects)", () => {
      component.isLoading = false;
      triggerCloseModal();
      expect(component.isLoading).toBeTruthy();
    });

    it("should reset form", () => {
      const formRestSpy = jest.spyOn(component.editTestForm, "reset");
      triggerCloseModal();
      expect(formRestSpy).toHaveBeenCalled();
    });

    function triggerCloseModal(): void {
      const modal = fixture.debugElement.query(By.css("p-dialog"));
      modal.triggerEventHandler("onHide", null);
    }
  });

  describe("on opening modal", () => {
    it("should retrieve test definition", () => {
      openModalWithPreSelectedTest();
      fixture.detectChanges();

      expect(fetchAllMock).toHaveBeenCalled();
    });

    it("should set isLoading to false", () => {
      component.isLoading = true;
      openModalWithPreSelectedTest();

      expect(component.isLoading).toBeFalsy();
    });

    it("should show skeleton when loading", () => {
      component.isLoading = true;
      fixture.detectChanges();

      const skeleton = fixture.debugElement.query(By.css("p-skeleton"));
      expect(skeleton).toBeTruthy();
    });

    it("should prefill test package definition with the selected one from the newly retrieved list", () => {
      openModalWithPreSelectedTest();

      expect(
        component.editTestForm.controls["testPackageDefinition"].value
      ).toEqual(getTestDefinitionsMock()[1]);
    });

    it("should populate test selection options of the selected test package definition from the new retrieved data", () => {
      openModalWithPreSelectedTest();

      expect(
        component.testPackageSelectionOptions.sort((a, b) =>
          a.id.localeCompare(b.id)
        )
      ).toEqual(
        getTestDefinitionsMock()[1].testSelections.sort((a, b) =>
          a.id.localeCompare(b.id)
        )
      );
    });

    it("should prefill test selections with the selected ones", () => {
      openModalWithPreSelectedTest();

      expect(
        component.editTestForm.controls["testPackageSelections"].value
      ).toEqual(getTestDefinitionsMock()[1].testSelections.slice(0, 2));
    });

    it("should populate all test tag options from the selected test package definition", () => {
      openModalWithPreSelectedTest();

      expect(component.tagOptions.sort()).toEqual(
        ["tag1", "tag2", "tag3"].sort()
      );
    });

    it("should infer and prefill tags from selected test selections", () => {
      openModalWithPreSelectedTest();

      expect(component.editTestForm.controls["tags"].value).toEqual([
        "tag1",
        "tag2",
      ]);
    });

    function openModalWithPreSelectedTest(): void {
      fetchAllMock.mockReturnValue(of(getTestDefinitionsMock()));

      const testDefinition: TestDefinition = JSON.parse(
        JSON.stringify(getTestDefinitionsMock()[1])
      );

      testDefinition.testSelections = testDefinition.testSelections.slice(0, 2);

      component.test = {
        full: false,
        testDefinition: testDefinition,
        testSelections: getTestDefinitionsMock()[1].testSelections.slice(0, 2),
      };

      const modal = fixture.debugElement.query(By.css("p-dialog"));
      modal.triggerEventHandler("onShow", null);
    }
  });

  describe("edit test form", () => {
    beforeEach(() => {
      component.isLoading = false;
      component.projectId = "1";
      fixture.detectChanges();
    });

    describe("test package definition field", () => {
      it("should be required", () => {
        component.editTestForm.controls["testPackageDefinition"].setValue("");

        expect(component.editTestForm.valid).toBeFalsy();
        expect(
          component.editTestForm.controls["testPackageDefinition"].errors
        ).toEqual({
          required: true,
        });
      });

      it("should be valid if a value is set", () => {
        component.editTestForm.controls["testPackageDefinition"].setValue(
          "test-def-1"
        );

        expect(component.editTestForm.valid).toBeTruthy();
      });

      it("should enable test selections field when selected", () => {
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: getTestDefinitionsMock()[1],
        });

        expect(
          component.editTestForm.controls["testPackageSelections"].enabled
        ).toBeTruthy();
      });

      it("should populate test selections field when selected", () => {
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: getTestDefinitionsMock()[1],
        });

        expect(component.testPackageSelectionOptions).toEqual([
          { id: "1", name: "Case 1", path: "", tags: ["tag1"] },
          { id: "2", name: "Case 2", path: "", tags: ["tag2", "tag1"] },
          { id: "3", name: "Case 3", path: "", tags: ["tag3"] },
        ]);
      });

      it("should enable test tags field when selected", () => {
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: getTestDefinitionsMock()[1],
        });

        expect(component.editTestForm.controls["tags"].enabled).toBeTruthy();
      });

      it("should populate test tags when selected", () => {
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: getTestDefinitionsMock()[1],
        });

        expect(component.tagOptions).toEqual(["tag1", "tag2", "tag3"]);
      });

      it("should disable test selections field when no test package definition is selected", () => {
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: null,
        });

        expect(
          component.editTestForm.controls["testPackageSelections"].disabled
        ).toBeTruthy();
      });

      it("should clear test selections field when no test package definition is selected", () => {
        component.editTestForm.controls["testPackageSelections"].setValue([
          "case1",
          "case2",
        ]);
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: null,
        });

        expect(
          component.editTestForm.controls["testPackageSelections"].value
        ).toEqual([]);
      });

      it("should disable test tags field when no test package definition is selected", () => {
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: null,
        });

        expect(component.editTestForm.controls["tags"].disabled).toBeTruthy();
      });

      it("should clear test tags field when when no test package definition is selected", () => {
        component.editTestForm.controls["tags"].setValue(["tag1", "tag2"]);
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: null,
        });

        expect(component.editTestForm.controls["tags"].value).toEqual([]);
      });
    });

    describe("test package tags field", () => {
      it("should use feature flag directive", () => {
        component.isVisible = true;
        component.editTestForm.controls["testPackageDefinition"].setValue(
          getTestDefinitionsMock()[1]
        );
        fixture.detectChanges();

        const directive = ngMocks.findInstance(ShowIfFeatureToggledDirective);

        expect(directive).toBeTruthy();
        expect(directive.mxevolveShowIfFeatureToggled).toEqual({
          projectId: "1",
          featureId: "test-tags",
        });
      });

      it("should filter available test selections based on selected tags", () => {
        component.projectId = "1";
        component.editTestForm.controls["testPackageDefinition"].setValue(
          getTestDefinitionsMock()[1]
        );
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: getTestDefinitionsMock()[1],
        });
        fixture.detectChanges();

        const tagsSelect = fixture.debugElement.query(By.css("#tags"));
        tagsSelect.triggerEventHandler("onChange", { value: ["tag2"] });

        expect(component.testPackageSelectionOptions).toEqual([
          { id: "2", name: "Case 2", path: "", tags: ["tag2", "tag1"] },
        ]);
      });

      it("should display the test selection options that are part of the remaining selected tags after a tag is removed", () => {
        component.projectId = "1";
        component.editTestForm.controls["testPackageDefinition"].setValue(
          getTestDefinitionsMock()[1]
        );
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: getTestDefinitionsMock()[1],
        });
        fixture.detectChanges();

        const tagsSelect = fixture.debugElement.query(By.css("#tags"));
        tagsSelect.triggerEventHandler("onChange", {
          value: ["tag2", "tag1", "tag3"],
        });

        fixture.detectChanges();
        expect(component.testPackageSelectionOptions).toEqual([
          { id: "1", name: "Case 1", path: "", tags: ["tag1"] },
          { id: "2", name: "Case 2", path: "", tags: ["tag2", "tag1"] },
          { id: "3", name: "Case 3", path: "", tags: ["tag3"] },
        ]);
        tagsSelect.triggerEventHandler("onChange", { value: ["tag2", "tag1"] });
        expect(component.testPackageSelectionOptions).toEqual([
          { id: "1", name: "Case 1", path: "", tags: ["tag1"] },
          { id: "2", name: "Case 2", path: "", tags: ["tag2", "tag1"] },
        ]);
      });

      it("should remove the selected test selections that are not part of the tag selected by the user afterward", () => {
        component.projectId = "1";
        component.editTestForm.controls["testPackageDefinition"].setValue(
          getTestDefinitionsMock()[1]
        );
        const testPackageDefinitionSelect = fixture.debugElement.query(
          By.css("#testPackageDefinition")
        );
        testPackageDefinitionSelect.triggerEventHandler("onChange", {
          value: getTestDefinitionsMock()[1],
        });
        component.editTestForm.controls["testPackageSelections"].setValue(
          getTestDefinitionsMock()[1].testSelections
        );
        fixture.detectChanges();

        const tagsSelect = fixture.debugElement.query(By.css("#tags"));
        tagsSelect.triggerEventHandler("onChange", { value: ["tag3"] });

        fixture.detectChanges();
        expect(
          component.editTestForm.controls["testPackageSelections"].value
        ).toEqual([getTestDefinitionsMock()[1].testSelections[2]]);
      });
    });
  });

  function getTestDefinitionsMock(): TestDefinition[] {
    return [
      {
        id: "1",
        name: "Test 1",
        testSelections: [],
        projectId: "1",
        repoId: "",
        path: "",
        timeoutDuration: {
          days: 0,
          hours: 0,
          minutes: 0,
        },
        description: "",
      },
      {
        id: "2",
        name: "Test 2",
        testSelections: [
          {
            id: "1",
            name: "Case 1",
            path: "",
            tags: ["tag1"],
          },
          {
            id: "2",
            name: "Case 2",
            path: "",
            tags: ["tag2", "tag1"],
          },
          {
            id: "3",
            name: "Case 3",
            path: "",
            tags: ["tag3"],
          },
        ],
        projectId: "1",
        repoId: "",
        path: "",
        timeoutDuration: {
          days: 0,
          hours: 0,
          minutes: 0,
        },
        description: "",
      },
    ];
  }

  function getTestMock() {
    return [
      {
        full: true,
        testDefinition: getTestDefinitionsMock()[0],
        testSelections: getTestDefinitionsMock()[0].testSelections,
      },
      {
        full: false,
        testDefinition: getTestDefinitionsMock()[1],
        testSelections: getTestDefinitionsMock()[1].testSelections,
      },
    ];
  }
});
