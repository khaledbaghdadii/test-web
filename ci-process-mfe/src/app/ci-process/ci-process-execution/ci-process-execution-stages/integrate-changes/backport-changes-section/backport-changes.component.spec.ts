import { BackportChangesComponent } from "./backport-changes.component";
import {
  Backport,
  FinalProductPublishing,
} from "@mxflow/features/business-process";

describe("Backport Changes Component Test", () => {
  let component: BackportChangesComponent;

  beforeEach(() => {
    component = new BackportChangesComponent();
  });

  describe("Show Publishing", () => {
    it("should not show publish final product if it will not publish", () => {
      component.backport = {
        willPublishFinalProduct: false,
        finalProductPublishing: {} as FinalProductPublishing,
      } as Backport;

      expect(component.shouldShowPublishing()).toStrictEqual(false);
    });

    it("should not show publish final product if the object is undefined", () => {
      component.backport = {
        willPublishFinalProduct: true,
      } as Backport;

      expect(component.shouldShowPublishing()).toStrictEqual(false);
    });

    it("should show publish final product if all conditions are met", () => {
      component.backport = {
        willPublishFinalProduct: true,
        finalProductPublishing: {} as FinalProductPublishing,
      } as Backport;

      expect(component.shouldShowPublishing()).toStrictEqual(true);
    });
  });
});
