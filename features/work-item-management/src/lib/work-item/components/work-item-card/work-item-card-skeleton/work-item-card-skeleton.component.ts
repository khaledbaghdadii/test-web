import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";

@Component({
  selector: "mxevolve-work-item-card-skeleton",
  templateUrl: "./work-item-card-skeleton.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CardModule, SkeletonModule],
})
export class WorkItemCardSkeletonComponent {}
