import { UpgradeImpactsPipe } from "./upgrade-impacts.pipe";
import { UpgradeImpact } from "../model/upgrade-impact.model";

describe("UpgradeImpactsPipe", () => {
  let pipe: UpgradeImpactsPipe;

  beforeEach(() => {
    pipe = new UpgradeImpactsPipe();
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should transform upgrade impacts into a comma separated string of ids", () => {
    const upgradeImpact1 = getUpgradeImpact("UI-001");
    const upgradeImpact2 = getUpgradeImpact("UI-002");
    const upgradeImpacts: UpgradeImpact[] = [upgradeImpact1, upgradeImpact2];
    expect(pipe.transform(upgradeImpacts)).toEqual(
      upgradeImpacts.map((impact) => impact.id).join(", ")
    );
  });

  it("should return a single id when there is one upgrade impact", () => {
    const upgradeImpacts: UpgradeImpact[] = [getUpgradeImpact("UI-001")];
    expect(pipe.transform(upgradeImpacts)).toEqual("UI-001");
  });

  it("should return an empty string when upgrade impacts is empty", () => {
    const upgradeImpacts: UpgradeImpact[] = [];
    expect(pipe.transform(upgradeImpacts)).toEqual("");
  });
});

function getUpgradeImpact(id: string): UpgradeImpact {
  return {
    id: id,
  } as UpgradeImpact;
}
