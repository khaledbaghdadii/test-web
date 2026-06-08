import { Pipe, PipeTransform } from "@angular/core";
import { UpgradeImpact } from "../model/upgrade-impact.model";

@Pipe({
  name: "upgradeImpacts",
})
export class UpgradeImpactsPipe implements PipeTransform {
  transform(upgradeImpacts: UpgradeImpact[]): string {
    return upgradeImpacts.map((impact) => impact.id).join(", ");
  }
}
