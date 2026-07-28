import { Component, Input, OnInit } from "@angular/core";
import { map, Observable, tap } from "rxjs";
import { AsyncPipe } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Select } from "primeng/select";
import { EnvironmentService } from "@mxflow/features/environment";
import { OptionField } from "../option-field/option-field";

@Component({
  selector: "mxevolve-business-process-environment-definition-selector",
  templateUrl:
    "business-process-environment-definition-selector.component.html",
  imports: [AsyncPipe, ReactiveFormsModule, Select],
  providers: [EnvironmentService],
})
export class BusinessProcessEnvironmentDefinitionSelectorComponent
  implements OnInit
{
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) environmentDefinitionFormControl: FormControl;
  @Input({ required: true }) environmentDefinitionFormControlName: string;
  @Input({ required: true }) invalidateHiddenEnvironmentDefinition: boolean;

  options$: Observable<OptionField[]>;

  constructor(private environmentService: EnvironmentService) {}

  ngOnInit(): void {
    this.options$ = this.environmentService
      .getEnvironmentDefinitions(this.projectId)
      .pipe(
        map((environmentDefinitions) =>
          environmentDefinitions.map((environmentDefinition) => {
            return {
              name: environmentDefinition.name,
              value: environmentDefinition.id,
            } as OptionField;
          })
        ),
        tap((options) => {
          this.clearSelectionIfPreselectedEnvironmentDefinitionIsNowHidden(
            options
          );
        })
      );
  }

  private clearSelectionIfPreselectedEnvironmentDefinitionIsNowHidden(
    options: OptionField[]
  ) {
    if (
      this.invalidateHiddenEnvironmentDefinition &&
      this.environmentDefinitionFormControl.value &&
      !options.some(
        (field) => field.value === this.environmentDefinitionFormControl.value
      )
    ) {
      this.environmentDefinitionFormControl.setValue(null);
    }
  }
}
