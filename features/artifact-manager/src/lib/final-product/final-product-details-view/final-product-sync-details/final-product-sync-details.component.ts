import { Component, computed, input } from "@angular/core";
import { FinalProductSyncDetails } from "../model/final-product-sync-details";
import { CommonModule } from "@angular/common";
import { CopyableModule } from "@mxflow/directive";
import { TagModule } from "primeng/tag";
import { DurationPipeModule, FormatDatePipeModule } from "@mxflow/pipe";
import { AuthorizationUtilsModule } from "@mxflow/core/auth";
import { SyncState, getSyncStateDisplayLabel } from "../../model/final-product";
import {
  MXEvolveShowMoreLessModule,
  ShowMoreLessTextComponent,
} from "@mxflow/ui/utils";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import { Skeleton } from "primeng/skeleton";
import { FormsModule } from "@angular/forms";
import { EnvironmentDefinition } from "@mxflow/features/environment";

type Severity =
  | "success"
  | "secondary"
  | "info"
  | "warn"
  | "danger"
  | "contrast";

@Component({
  standalone: true,
  selector: "mxevolve-final-product-sync-details",
  templateUrl: "./final-product-sync-details.component.html",
  imports: [
    CommonModule,
    TagModule,
    CopyableModule,
    FormatDatePipeModule,
    DurationPipeModule,
    AuthorizationUtilsModule,
    ShowMoreLessTextComponent,
    MXEvolveShowMoreLessModule,
    ToggleSwitch,
    Tooltip,
    Skeleton,
    FormsModule,
  ],
})
export class FinalProductSyncDetailsComponent {
  finalProductSyncDetails = input.required<FinalProductSyncDetails>();
  environmentDefinitions = input.required<EnvironmentDefinition[]>();
  fetchEnvironmentsLoading = input.required<boolean>();
  showEnvironmentDefinitionNames = input.required<boolean>();

  environmentDefinitionNames = computed(() => {
    const definitions = this.environmentDefinitions();
    const syncRequestDetails =
      this.finalProductSyncDetails()?.syncRequestDetails;
    if (!syncRequestDetails || !definitions) return [];
    const ids = syncRequestDetails.environmentDefinitionIds;
    return definitions
      .filter((def) => ids.includes(def.id))
      .map((def) => def.name);
  });

  private readonly severityMap: Record<string, Severity> = {
    SUCCESS: "success",
    FAILED: "danger",
    IN_PROGRESS: "secondary",
    UNSTABLE: "warn",
  };

  getLightPackageTooltip(): string {
    return "When enabled, only the client configurations are synced without the factory product artifacts.";
  }

  getStateSeverity(state: SyncState): Severity {
    return this.severityMap[state.toUpperCase()] ?? "info";
  }

  getStateDisplayLabel(state: string): string {
    return getSyncStateDisplayLabel(state);
  }

  protected readonly SyncState = SyncState;
}
