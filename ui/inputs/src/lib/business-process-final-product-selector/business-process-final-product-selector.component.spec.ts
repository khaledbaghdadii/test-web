import { fakeAsync, tick } from "@angular/core/testing";
import {
  BusinessProcessFinalProductInput,
  BusinessProcessFinalProductSelectorComponent,
} from "./business-process-final-product-selector.component";
import { FormControl } from "@angular/forms";
import {
  FinalProduct,
  FinalProductDropdownInputLabelMode,
  RtpProduct,
} from "@mxflow/features/artifact-manager";

describe("Business process final product selector", () => {
  let component: BusinessProcessFinalProductSelectorComponent;
  const selectedFinalProductId = "somefinalproductid";

  beforeEach(() => {
    component = new BusinessProcessFinalProductSelectorComponent();
    component.finalProductSelectionFormControl =
      new FormControl<BusinessProcessFinalProductInput>(
        {
          id: undefined,
          configurationCommitId: undefined,
          rtpCommitId: undefined,
        },
        { nonNullable: true }
      );
  });

  it("should set the final product id on the form control when selected", fakeAsync(() => {
    component.handleSelectedFinalProduct({
      id: selectedFinalProductId,
    } as FinalProduct);
    tick();

    expect(component.finalProductSelectionFormControl.value?.id).toEqual(
      selectedFinalProductId
    );
  }));

  it("should set the final product configuration commit id on the form control when selected", fakeAsync(() => {
    component.handleSelectedFinalProduct({
      configurationCommitId: "somecommitid",
    } as FinalProduct);
    tick();

    expect(
      component.finalProductSelectionFormControl.value?.configurationCommitId
    ).toEqual("somecommitid");
  }));

  it("should set the final product rtp commit id on the form control when selected", fakeAsync(() => {
    component.handleSelectedFinalProduct({
      rtpProduct: { rtpCommitId: "somertpcommitid" } as RtpProduct,
    } as FinalProduct);
    tick();

    expect(
      component.finalProductSelectionFormControl.value?.rtpCommitId
    ).toEqual("somertpcommitid");
  }));

  it("should set the form control value to undefined when the final product is cleared", fakeAsync(() => {
    component.handleSelectedFinalProduct(undefined);
    tick();

    expect(component.finalProductSelectionFormControl.value).toEqual(undefined);
  }));

  it("should set the rtp commit same as configuration commit id when rtp product is not available", fakeAsync(() => {
    component.handleSelectedFinalProduct({
      configurationCommitId: "somecommitid",
    } as FinalProduct);
    tick();

    expect(
      component.finalProductSelectionFormControl.value?.rtpCommitId
    ).toEqual("somecommitid");
  }));

  it("should mark data as not ready upon initialization", () => {
    expect(component.dataReady).toBeFalsy();
  });

  it("should mark data as ready once data is loaded", () => {
    component.handleDataReadinessChange(true);

    expect(component.dataReady).toBeTruthy();
  });

  it("should mark data as not ready if it started loading after it was initially loaded", () => {
    component.handleDataReadinessChange(true);
    component.handleDataReadinessChange(false);

    expect(component.dataReady).toBeFalsy();
  });

  it("should set the pre-selected final product id", () => {
    component.finalProductSelectionFormControl = {
      defaultValue: { id: selectedFinalProductId },
    } as FormControl<BusinessProcessFinalProductInput>;
    component.ngOnInit();
    expect(component.customFinalProductId).toEqual(selectedFinalProductId);
  });

  it("it should set an empty string as custom final product id when the final product does not have a pre-selected value", () => {
    component.finalProductSelectionFormControl = {
      defaultValue: { id: undefined },
    } as FormControl<BusinessProcessFinalProductInput>;
    component.ngOnInit();
    expect(component.customFinalProductId).toEqual("");
  });

  it("should set label mode to tag commit id when show as tags is true", () => {
    component.showAsTags = true;
    component.ngOnInit();
    expect(component.finalProductDropdownLabelMode).toEqual(
      FinalProductDropdownInputLabelMode.TAG_COMMIT_ID
    );
  });

  it("should set label mode to commit id when show as tags is false", () => {
    component.showAsTags = false;
    component.ngOnInit();
    expect(component.finalProductDropdownLabelMode).toEqual(
      FinalProductDropdownInputLabelMode.COMMIT_ID
    );
  });
});
