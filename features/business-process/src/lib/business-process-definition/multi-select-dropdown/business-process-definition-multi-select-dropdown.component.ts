import { Component, inject, Input, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MultiSelectModule } from "primeng/multiselect";
import { BusinessProcessDefinitionService } from "../business-process-definition.service";
import { BusinessProcessDefinition } from "../business-process-definition";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-business-process-definition-multi-select-dropdown",
  templateUrl:
    "business-process-definition-multi-select-dropdown.component.html",
  imports: [ReactiveFormsModule, MultiSelectModule],
})
export class BusinessProcessDefinitionMultiSelectDropdownComponent
  implements OnInit
{
  definitionService = inject(BusinessProcessDefinitionService);
  messageService = inject(ToastMessageService);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) formControl: FormControl<
    BusinessProcessDefinition[] | null
  >;
  @Input() sourceDefinitionId: string;

  loading = true;
  definitions: BusinessProcessDefinition[];

  ngOnInit(): void {
    this.definitionService
      .getBusinessProcessDefinitions({
        projectId: this.projectId,
        executable: true,
        extendable: false,
      })
      .subscribe({
        next: (definitions: BusinessProcessDefinition[]) => {
          if (this.sourceDefinitionId) {
            this.definitions = definitions.filter(
              (definition) =>
                definition.sourceDefinitionId === this.sourceDefinitionId
            );
          } else {
            this.definitions = definitions;
          }

          this.loading = false;
        },
        error: (error) => {
          this.messageService.showError(error.message);
        },
      });
  }
}
