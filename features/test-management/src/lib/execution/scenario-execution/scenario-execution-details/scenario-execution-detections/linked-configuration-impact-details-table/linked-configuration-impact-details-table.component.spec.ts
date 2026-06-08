import { LinkedConfigurationImpactDetailsTableComponent } from "./linked-configuration-impact-details-table.component";

describe("LinkedConfigurationImpactDetailsTableComponent", () => {
  const CONFIGURATION_IMPACT_ID = "configurationImpactId";

  let component: LinkedConfigurationImpactDetailsTableComponent;

  beforeEach(() => {
    component = new LinkedConfigurationImpactDetailsTableComponent();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("handleUnlink", () => {
    it("should emit unlink config impact request event when confirmed", () => {
      jest.spyOn(component.unlinkImpactRequestEvent, "emit");
      component.handleUnlink(CONFIGURATION_IMPACT_ID);

      expect(component.unlinkImpactRequestEvent.emit).toHaveBeenCalledWith(
        CONFIGURATION_IMPACT_ID
      );
    });
  });
});
