import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EnvironmentMultiSelectInputComponent } from "./environment-multi-select-input.component";
import {
  MxevolveMultiselectDropdownComponent,
  BaseMultiselectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";
import { EnvironmentService } from "../service/environment.service";
import { of } from "rxjs";
import { EnvironmentDefinition } from "../environment-definition";

describe("EnvironmentMultiSelectInputComponent", () => {
  let fixture: ComponentFixture<EnvironmentMultiSelectInputComponent>;
  let component: EnvironmentMultiSelectInputComponent;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;

  const ENVIRONMENT_DEFINITION: EnvironmentDefinition = {
    id: "env-def-1",
    name: "Environment 1",
  } as EnvironmentDefinition;

  const PROJECT_ID = "test-project-id";

  beforeEach(async () => {
    mockEnvironmentService = {
      getEnvironmentDefinitions: jest
        .fn()
        .mockReturnValue(of([ENVIRONMENT_DEFINITION])),
    } as unknown as jest.Mocked<EnvironmentService>;

    await TestBed.configureTestingModule({
      imports: [
        EnvironmentMultiSelectInputComponent,
        MxevolveMultiselectDropdownComponent,
      ],
    })
      .overrideComponent(EnvironmentMultiSelectInputComponent, {
        set: {
          providers: [
            ...BaseMultiselectDropdown.createProviders(
              EnvironmentMultiSelectInputComponent
            ),
            {
              provide: EnvironmentService,
              useValue: mockEnvironmentService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EnvironmentMultiSelectInputComponent);
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should extend BaseMultiselectDropdown", () => {
    expect(component).toBeInstanceOf(BaseMultiselectDropdown);
  });

  it("should have projectId input", () => {
    expect(component.projectId()).toBe(PROJECT_ID);
  });

  it("should have state provider initialized", () => {
    expect(component["stateProvider"]).toBeDefined();
  });

  it("should have selectedEnvironmentsChange output", () => {
    expect(component.selectedEnvironmentsChange).toBeDefined();
  });

  describe("includeInactive", () => {
    it("should default includeInactive to false", () => {
      expect(component.includeInactive()).toBe(false);
    });

    it("should support setting includeInactive to true", () => {
      fixture.componentRef.setInput("includeInactive", true);
      expect(component.includeInactive()).toBe(true);
    });
  });

  describe("dropdownConfig", () => {
    it("should set placeholder", () => {
      const config = component.dropdownConfig();
      expect(config.placeholder).toBe("Select Environment Definitions");
    });

    it("should set maxSelectedLabels to 3", () => {
      const config = component.dropdownConfig();
      expect(config.maxSelectedLabels).toBe(3);
    });
  });

  describe("onSelectionChange", () => {
    it("should emit selectedEnvironmentsChange when selection changes", () => {
      const emitSpy = jest.spyOn(component.selectedEnvironmentsChange, "emit");
      const selectedItems = [ENVIRONMENT_DEFINITION];

      component.onSelectionChange(selectedItems);

      expect(emitSpy).toHaveBeenCalledWith(selectedItems);
    });
  });
});
