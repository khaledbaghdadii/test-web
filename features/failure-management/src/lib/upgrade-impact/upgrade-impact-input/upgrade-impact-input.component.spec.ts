import { UpgradeImpactInputComponent } from "./upgrade-impact-input.component";
import { UpgradeImpact } from "../model/upgrade-impact.model";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { DomTestUtils } from "@mxevolve/testing";
import { ButtonModule } from "primeng/button";

describe("UpgradeImpactInputComponent", () => {
  let component: UpgradeImpactInputComponent;
  let fixture: MockedComponentFixture<UpgradeImpactInputComponent>;

  beforeEach(async () => {
    await MockBuilder(UpgradeImpactInputComponent).keep(ButtonModule);
    fixture = MockRender(UpgradeImpactInputComponent);
    component = fixture.point.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show upgrade impact modal correclty", () => {
    component.showUpgradeImpactModal();
    expect(component.isUpgradeImpactModalVisible).toEqual(true);
  });

  it("should write upgrade impact value correctly when a value is present", () => {
    component.writeValue(getUpgradeImpact().id);

    expect(component.selectedUpgradeImpactId).toStrictEqual(
      getUpgradeImpact().id
    );
  });

  it.each([undefined, null])(
    "should write upgrade impact value correctly when no value is present",
    (upgradeImpact) => {
      component.writeValue(upgradeImpact);

      expect(component.selectedUpgradeImpactId).toStrictEqual(null);
    }
  );

  it("should register onChange function", () => {
    const fn = jest.fn();

    component.registerOnChange(fn);

    expect(component.onChange).toBe(fn);
  });

  it("should register onTouched function", () => {
    const fn = jest.fn();

    component.registerOnTouched(fn);

    expect(component.onTouched).toBe(fn);
  });

  it("handleSelectedUpgradeImpactChange should set selected upgrade impact", () => {
    component.handleSelectedUpgradeImpactChange(getUpgradeImpact().id);

    expect(component.selectedUpgradeImpactId).toStrictEqual(
      getUpgradeImpact().id
    );
  });

  it("handleSelectedUpgradeImpactChange should set selected upgrade impact to null when undefined is passed", () => {
    component.handleSelectedUpgradeImpactChange(undefined);
    expect(component.selectedUpgradeImpactId).toBeNull();
  });

  it("handleSelectedUpgradeImpactChange should call onChange and onTouched functions", () => {
    component.registerOnChange(jest.fn());
    component.registerOnTouched(jest.fn());

    component.handleSelectedUpgradeImpactChange(getUpgradeImpact().id);

    expect(component.onChange).toHaveBeenCalledWith(getUpgradeImpact().id);
    expect(component.onTouched).toHaveBeenCalled();
  });

  it("handleSelectedUpgradeImpactChange should call onChange and onTouched functions when selection is undefined", () => {
    component.registerOnChange(jest.fn());
    component.registerOnTouched(jest.fn());

    component.handleSelectedUpgradeImpactChange(undefined);
    expect(component.onChange).toHaveBeenCalledWith(null);
    expect(component.onTouched).toHaveBeenCalled();
  });

  it("should handle error messages", () => {
    const emitterSpy = jest.spyOn(component.errorMessage, "emit");

    component.handleErrorMessage("errorMessage");

    expect(emitterSpy).toHaveBeenCalledWith("errorMessage");
  });

  it("handle set selected upgrade impact sets the selected upgrade impact value", () => {
    component.selectedUpgradeImpact = null;

    component.handleSetSelectedUpgradeImpact(getUpgradeImpact());

    expect(component.selectedUpgradeImpact).toEqual(getUpgradeImpact());
  });

  it("should reset selected upgrade impact when selected upgrade impact id is reset", () => {
    component.selectedUpgradeImpactId = "123";
    component.selectedUpgradeImpact = getUpgradeImpact();

    component.selectedUpgradeImpactId = null;
    expect(component.selectedUpgradeImpact).toEqual(null);
  });

  describe("disabling the component", () => {
    beforeEach(() => {
      component.setDisabledState(true);
      fixture.detectChanges();
    });

    it("should disable the input field", () => {
      expect(
        fixture.debugElement.query(By.css("input")).nativeElement.disabled
      ).toBeTruthy();
    });

    it("should disable the select button", () => {
      expect(getBrowseButtonHarness().isDisabled()).toBeTruthy();
    });

    it("should disable the clear button", () => {
      expect(getClearButtonHarness().isDisabled()).toBeTruthy();
    });
  });

  describe("clearing the selected upgrade impact", () => {
    beforeEach(() => {
      component.selectedUpgradeImpactId = getUpgradeImpact().id;
      component.selectedUpgradeImpact = getUpgradeImpact();
    });

    it("should clear the selected upgrade impact when clear button is clicked", () => {
      getClearButtonHarness().click();
      expect(component.selectedUpgradeImpactId).toBeNull();
      expect(component.selectedUpgradeImpact).toBeNull();
    });

    it("should call the onChange method", () => {
      const onChangeSpy = jest.spyOn(component, "onChange");
      getClearButtonHarness().click();
      expect(onChangeSpy).toHaveBeenCalledWith(null);
    });

    it("should call the onTouched method", () => {
      const onTouchedSpy = jest.spyOn(component, "onTouched");
      getClearButtonHarness().click();
      expect(onTouchedSpy).toHaveBeenCalled();
    });
  });

  function getClearButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "clear-upgrade-impact-button"
    );
  }

  function getBrowseButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "browse-upgrade-impacts-button"
    );
  }
});

function getUpgradeImpact(): UpgradeImpact {
  return {
    id: "id",
    title: "title",
    impactType: "impactType",
    attachments: [],
    fullDescription: "full description",
    impactDocumentationTrigger: "impactDocumentationTrigger",
    introducedInArchival: ["introducedInArchival"],
    introducedInReleaseVersion: ["introducedInReleaseVersion"],
    impactedOutputs: "impactedOutputs",
    impactedInstrumentsScope: ["impactedInstrumentsScope"],
    bpcFFTopic: ["bpcFFTopic"],
    defects: [
      {
        defectId: "defectId",
        defectLink: "defectLink",
      },
    ],
    externalIssue: {
      id: "id",
      origin: "origin",
      link: "link",
    },
  };
}
