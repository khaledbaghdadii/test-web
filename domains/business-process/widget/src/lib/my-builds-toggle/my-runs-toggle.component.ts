import { Component, inject, model, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ToggleSwitch, ToggleSwitchChangeEvent } from "primeng/toggleswitch";
import { AuthenticationService } from "@mxflow/core/auth";

/**
 * "My Builds" filter for the activity landing tables. When enabled it emits the
 * logged-in user's name as the `ownerPhrase` the table applies; when disabled
 * it emits `undefined` to clear the filter.
 */
@Component({
  selector: "mxevolve-my-runs-toggle",
  imports: [FormsModule, ToggleSwitch],
  templateUrl: "./my-runs-toggle.component.html",
})
export class MyRunsToggleComponent {
  readonly enabled = model(false);
  readonly ownerPhrase = output<string | undefined>();

  private readonly authService = inject(AuthenticationService);

  onToggle(event: ToggleSwitchChangeEvent): void {
    this.enabled.set(event.checked);
    this.ownerPhrase.emit(
      event.checked ? this.authService.getUsername() : undefined
    );
  }
}
