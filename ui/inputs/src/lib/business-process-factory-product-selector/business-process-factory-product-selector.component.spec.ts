import { BusinessProcessFactoryProductSelectorComponent } from "@mxflow/ui/inputs";
import { FormControl } from "@angular/forms";

describe("BusinessProcessFactoryProductSelectorComponent", () => {
  let component: BusinessProcessFactoryProductSelectorComponent;

  beforeEach(() => {
    component = new BusinessProcessFactoryProductSelectorComponent();
  });

  describe("When factory product is not preselected", () => {
    beforeEach(() => {
      component.factoryProductFormControl = new FormControl();
    });

    it("should set factory product id from the selected one", () => {
      component.onFactoryProductIdChange("someFactoryProductId");
      expect(component.factoryProductFormControl.value?.id).toEqual(
        "someFactoryProductId"
      );
    });

    it("should mark factory product form control as dirty upon factory product id change", () => {
      component.onFactoryProductIdChange("someFactoryProductId");
      expect(component.factoryProductFormControl.dirty).toBeTruthy();
    });

    it("should set mx version from the selected one", () => {
      component.onMxVersionChange("someMxVersion");
      expect(component.factoryProductFormControl.value?.mxVersion).toEqual(
        "someMxVersion"
      );
    });

    it("should mark factory product form control as dirty upon mxVersion change", () => {
      component.onMxVersionChange("someMxVersion");
      expect(component.factoryProductFormControl.dirty).toBeTruthy();
    });

    it("should set mx build id from the selected one", () => {
      component.onMxBuildIdChange("someMxBuildId");
      expect(component.factoryProductFormControl.value?.mxBuildId).toEqual(
        "someMxBuildId"
      );
    });

    it("should mark factory product form control as dirty upon mxBuildId change", () => {
      component.onMxBuildIdChange("someMxBuildId");
      expect(component.factoryProductFormControl.dirty).toBeTruthy();
    });

    it("should set bip version from the selected one", () => {
      component.onBipVersionChange("someBipVersion");
      expect(component.factoryProductFormControl.value?.bipVersion).toEqual(
        "someBipVersion"
      );
    });

    it("should mark factory product form control as dirty upon bip version change", () => {
      component.onBipVersionChange("someBipVersion");
      expect(component.factoryProductFormControl.dirty).toBeTruthy();
    });

    it("should set bip build id from the selected one", () => {
      component.onBipBuildIdChange("someBipBuildId");
      expect(component.factoryProductFormControl.value?.bipBuildId).toEqual(
        "someBipBuildId"
      );
    });

    it("should mark factory product form control as dirty upon bip build id change", () => {
      component.onBipBuildIdChange("someBipBuildId");
      expect(component.factoryProductFormControl.dirty).toBeTruthy();
    });
  });

  describe("When factory product is preselected", () => {
    beforeEach(() => {
      component.factoryProductFormControl = new FormControl();
      component.factoryProductFormControl.setValue({
        id: "someFactoryProductId",
        mxVersion: "someMxVersion",
        mxBuildId: "someMxBuildId",
        bipVersion: "someBipVersion",
        bipBuildId: "someBipBuildId",
      });
    });

    it("should set factory product id from the selected one", () => {
      component.onFactoryProductIdChange("anotherFactoryProductId");
      expect(component.factoryProductFormControl.value?.id).toEqual(
        "anotherFactoryProductId"
      );
    });

    it("should set mx version from the selected one", () => {
      component.onMxVersionChange("anotherMxVersion");
      expect(component.factoryProductFormControl.value?.mxVersion).toEqual(
        "anotherMxVersion"
      );
    });

    it("should set mx build id from the selected one", () => {
      component.onMxBuildIdChange("anotherMxBuildId");
      expect(component.factoryProductFormControl.value?.mxBuildId).toEqual(
        "anotherMxBuildId"
      );
    });

    it("should set bip version from the selected one", () => {
      component.onBipVersionChange("anotherBipVersion");
      expect(component.factoryProductFormControl.value?.bipVersion).toEqual(
        "anotherBipVersion"
      );
    });

    it("should set bip build id from the selected one", () => {
      component.onBipBuildIdChange("anotherBipBuildId");
      expect(component.factoryProductFormControl.value?.bipBuildId).toEqual(
        "anotherBipBuildId"
      );
    });
  });
});
