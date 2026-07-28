import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import {
  ScenarioDefinitionSingleSelectorComponent,
  ScenarioDefinitionMultiSelectorComponent,
} from "@mxflow/test-management/definition";
import { MockComponent } from "ng-mocks";
import { BusinessProcessScenarioDefinitionSelectorComponent } from "./business-process-scenario-definition-selector.component";

const PROJECT_ID = "projectId";

describe("BusinessProcessScenarioDefinitionSelectorComponent", () => {
  let fixture: ComponentFixture<BusinessProcessScenarioDefinitionSelectorComponent>;
  let component: BusinessProcessScenarioDefinitionSelectorComponent;

  async function setup(multiValue: boolean): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [
        BusinessProcessScenarioDefinitionSelectorComponent,
        ReactiveFormsModule,
      ],
    })
      .overrideComponent(BusinessProcessScenarioDefinitionSelectorComponent, {
        remove: {
          imports: [
            ScenarioDefinitionSingleSelectorComponent,
            ScenarioDefinitionMultiSelectorComponent,
          ],
        },
        add: {
          imports: [
            MockComponent(ScenarioDefinitionSingleSelectorComponent),
            MockComponent(ScenarioDefinitionMultiSelectorComponent),
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(
      BusinessProcessScenarioDefinitionSelectorComponent
    );
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
    component.testScenarioFormControl = new FormControl();
    component.testScenariosFormControlName = "testScenarios";
    component.multiValue = multiValue;
    fixture.detectChanges();
  }

  describe("Given multiValue is true", () => {
    beforeEach(async () => {
      await setup(true);
    });

    it("should render the multi selector component", () => {
      const multiSelector = fixture.debugElement.query(
        By.css("mxevolve-scenario-definition-multi-selector")
      );
      expect(multiSelector).toBeTruthy();
    });

    it("should not render the single selector component", () => {
      const singleSelector = fixture.debugElement.query(
        By.css("mxevolve-scenario-definition-single-selector")
      );
      expect(singleSelector).toBeFalsy();
    });
  });

  describe("Given multiValue is false", () => {
    beforeEach(async () => {
      await setup(false);
    });

    it("should render the single selector component", () => {
      const singleSelector = fixture.debugElement.query(
        By.css("mxevolve-scenario-definition-single-selector")
      );
      expect(singleSelector).toBeTruthy();
    });

    it("should not render the multi selector component", () => {
      const multiSelector = fixture.debugElement.query(
        By.css("mxevolve-scenario-definition-multi-selector")
      );
      expect(multiSelector).toBeFalsy();
    });
  });

  describe("Given default multiValue", () => {
    beforeEach(async () => {
      await setup(true);
    });

    it("should default to rendering the multi selector component", () => {
      const multiSelector = fixture.debugElement.query(
        By.css("mxevolve-scenario-definition-multi-selector")
      );
      expect(multiSelector).toBeTruthy();
    });
  });
});
