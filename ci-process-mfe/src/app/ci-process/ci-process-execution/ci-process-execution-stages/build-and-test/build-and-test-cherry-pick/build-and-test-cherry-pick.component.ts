import { Component, Input } from "@angular/core";
import { InfoAlertComponent, WarningAlertModule } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-build-and-test-cherry-pick",
  imports: [InfoAlertComponent, WarningAlertModule],
  templateUrl: "build-and-test-cherry-pick.component.html",
})
export class BuildAndTestCherryPickComponent {
  @Input({ required: true }) cherryPickRunning: boolean;
  @Input({ required: true }) cherryPickFailed: boolean;
  @Input({ required: true }) temporaryBranchName: string;
}
