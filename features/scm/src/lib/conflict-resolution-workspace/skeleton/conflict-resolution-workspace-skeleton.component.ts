import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SkeletonModule } from "primeng/skeleton";

@Component({
  selector: "mxevolve-conflict-resolution-workspace-skeleton",
  standalone: true,
  imports: [SkeletonModule],
  templateUrl: "./conflict-resolution-workspace-skeleton.component.html",
  host: {
    class: "block h-full min-h-0 w-full",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictResolutionWorkspaceSkeletonComponent {}
