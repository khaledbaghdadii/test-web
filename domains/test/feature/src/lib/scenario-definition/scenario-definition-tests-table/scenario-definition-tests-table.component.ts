import { Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Test } from "@mxevolve/domains/test/model";
import { OrdinalNumberPipe } from "@mxevolve/shared/pipe";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { SkeletonModule } from "primeng/skeleton";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";

@Component({
  selector: "mxevolve-scenario-definition-tests-table",
  templateUrl: "./scenario-definition-tests-table.component.html",
  standalone: true,
  imports: [
    RouterModule,
    TableModule,
    TagModule,
    SkeletonModule,
    OrdinalNumberPipe,
    TableEmptyMessageComponent,
  ],
})
export class ScenarioDefinitionTestsTableComponent {
  tests = input.required<Test[]>();
  isLoading = input.required<boolean>();
}
