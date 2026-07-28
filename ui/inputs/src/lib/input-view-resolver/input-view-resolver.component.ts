import { Component, Input } from "@angular/core";
import { InputField } from "@mxflow/ui/inputs";
import { SkeletonModule } from "primeng/skeleton";
import { CommonModule } from "@angular/common";
import { GetRepositoryNamePipe } from "@mxflow/features/repository";
import { TagModule } from "primeng/tag";
import { GetInfraGroupNamePipe } from "@mxflow/features/infra-management";
import { FactoryProductInputViewComponent } from "./factory-product-input-view/factory-product-input-view.component";
import {
  GetScenarioDefinitionNamePipe,
  GetScenarioDefinitionNamesPipe,
} from "@mxflow/test-management/definition";
import { GetEnvironmentDefinitionNamePipe } from "@mxflow/features/environment";
import { GetDestinationBranchNamePipe } from "@mxflow/features/scm-management";

@Component({
  imports: [
    CommonModule,
    SkeletonModule,
    GetRepositoryNamePipe,
    GetScenarioDefinitionNamePipe,
    GetScenarioDefinitionNamesPipe,
    GetEnvironmentDefinitionNamePipe,
    TagModule,
    GetInfraGroupNamePipe,
    FactoryProductInputViewComponent,
    GetDestinationBranchNamePipe,
  ],
  selector: "mxevolve-input-view",
  templateUrl: "./input-view-resolver.component.html",
})
export class InputViewResolverComponent {
  @Input() input: InputField;
}
