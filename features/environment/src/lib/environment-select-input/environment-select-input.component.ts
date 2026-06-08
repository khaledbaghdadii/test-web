import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  NgModule,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { EnvironmentDefinition } from "../environment-definition";
import { EnvironmentService } from "../service/environment.service";
import { MandatoryModule } from "@mxflow/directive";
import { SkeletonModule } from "primeng/skeleton";
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: "mxevolve-environment-select-input",
  templateUrl: "./environment-select-input.component.html",
  standalone: false,
})
export class EnvironmentSelectInputComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input() form: FormGroup;
  @Input() errorTipTemplate: TemplateRef<any>;
  @Input() isFormLoading = false;
  @Input({ required: true }) projectId: string;
  @Input() showLabel = true;
  filteredEnvironmentDefinitions: EnvironmentDefinition[] = [];
  private _defaultEnvironmentDefinitionId: string;
  @Input()
  public get defaultEnvironmentDefinitionId(): string {
    return this._defaultEnvironmentDefinitionId;
  }

  @Output()
  environmentDefinitionSelected = new EventEmitter<EnvironmentDefinition>();

  public set defaultEnvironmentDefinitionId(environmentDefinitionId: string) {
    this._defaultEnvironmentDefinitionId = environmentDefinitionId;
    this.handlePrefilling();
  }

  environmentDefinitions: EnvironmentDefinition[];
  searchKey = "";
  readonly environmentService = inject(EnvironmentService);

  ngOnInit(): void {
    this.environmentService
      .getEnvironmentDefinitions(this.projectId)
      .subscribe((environmentDefinitions: EnvironmentDefinition[]) => {
        this.environmentDefinitions = environmentDefinitions;
        this.filteredEnvironmentDefinitions = environmentDefinitions;
        this.handlePrefilling();
        this.subscribeToEnvironmentDefinitionChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onSearch(): void {
    const searchKeyLower = this.searchKey.toLowerCase();
    this.filteredEnvironmentDefinitions = this.environmentDefinitions.filter(
      (environmentDefinition) =>
        environmentDefinition.name.toLowerCase().includes(searchKeyLower)
    );
  }

  clearSearchValue(event: { stopPropagation: () => void }): void {
    event.stopPropagation();
    this.searchKey = "";
    this.onSearch();
  }

  private handlePrefilling() {
    const isDefaultEnvironmentDefinitionActive =
      this.environmentDefinitions?.some(
        (environmentDefinition: EnvironmentDefinition) =>
          environmentDefinition.id === this.defaultEnvironmentDefinitionId
      );
    if (isDefaultEnvironmentDefinitionActive)
      this.form
        .get("environmentDefinitionId")
        ?.setValue(this.defaultEnvironmentDefinitionId);
  }

  private subscribeToEnvironmentDefinitionChanges() {
    this.form
      .get("environmentDefinitionId")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (environmentDefinitionId: string) => {
          const selectedEnvironmentDefinition =
            this.environmentDefinitions.find(
              (environmentDefinition) =>
                environmentDefinition.id === environmentDefinitionId
            );
          this.environmentDefinitionSelected.emit(
            selectedEnvironmentDefinition
          );
        },
      });
  }
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MandatoryModule,
    SkeletonModule,
    InputTextModule,
    IconField,
    InputIcon,
    SelectModule,
  ],
  declarations: [EnvironmentSelectInputComponent],
  exports: [EnvironmentSelectInputComponent],
  providers: [EnvironmentService],
})
export class EnvironmentSelectInputModule {}
