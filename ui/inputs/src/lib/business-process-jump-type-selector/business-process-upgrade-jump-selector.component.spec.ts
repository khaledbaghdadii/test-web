import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { BusinessProcessUpgradeJumpSelectorComponent } from "@mxflow/ui/inputs";

describe("BusinessProcessUpgradeJumpSelectorComponent", () => {
  let component: BusinessProcessUpgradeJumpSelectorComponent;
  let fixture: ComponentFixture<BusinessProcessUpgradeJumpSelectorComponent>;
  let mockFormControl: FormControl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessProcessUpgradeJumpSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BusinessProcessUpgradeJumpSelectorComponent
    );
    component = fixture.componentInstance;
    mockFormControl = new FormControl();
    component.upgradeJumpFormControl = mockFormControl;
    component.upgradeJumpFormControlName = "testFormControl";
    fixture.detectChanges();
  });

  describe("Initial Display", () => {
    it("Given the selector is loaded, When user views the component, Then upgrade jump options are available for selection", () => {
      expect(component.upgradeJump).toEqual([
        { label: "Continuous Greening", value: "Continuous Greening" },
        { label: "Mainstream Activation", value: "Mainstream Activation" },
      ]);
      expect(component.upgradeJump).toHaveLength(2);
    });
  });

  describe("Selection Behavior", () => {
    it("Given user makes a selection, When the value changes, Then the new selection is reflected in the component", () => {
      const newValue = "Mainstream Activation";

      mockFormControl.setValue(newValue);
      fixture.detectChanges();

      expect(component.upgradeJumpFormControl.value).toBe(newValue);
    });
  });
});
