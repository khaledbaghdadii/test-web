import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  filter,
  map,
  Observable,
  startWith,
  Subject,
  takeUntil,
  tap,
} from "rxjs";
import { BusinessProcessRepositorySelectorComponent } from "@mxflow/ui/inputs";
import { Select } from "primeng/select";
import { ValidationProcessMqgParametersComponent } from "./validation-process-mqg-parameters/validation-process-mqg-parameters.component";
import { AsyncPipe } from "@angular/common";
import { ValidationProcessDqgParametersComponent } from "./validation-process-dqg-parameters/validation-process-dqg-parameters.component";
import { DefinitionInputComponent } from "../../definition-input/definition-input.component";
import { DisplayMode } from "../../definition-input/display-mode";
import { InputAccessMode } from "../../definition-input/input-access-mode";

@Component({
  selector: "mxevolve-validation-process-configuration-parameters",
  templateUrl: "validation-process-configuration-parameters.component.html",
  imports: [
    DefinitionInputComponent,
    BusinessProcessRepositorySelectorComponent,
    Select,
    ValidationProcessMqgParametersComponent,
    AsyncPipe,
    ReactiveFormsModule,
    ValidationProcessDqgParametersComponent,
  ],
})
export class ValidationProcessConfigurationParametersComponent
  implements OnInit, OnDestroy
{
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) repositoryIdFormControl: FormControl;
  @Input({ required: true })
  businessProcessQualityLevelFormControl: FormControl;
  @Input({ required: true }) createBranchFormControl: FormControl;
  @Input({ required: true }) archivalBranchNameFormControl: FormControl;
  @Input({ required: true }) parentBranchFormControl: FormControl;
  @Input({ required: true }) finalProductIdFromControl: FormControl;
  @Input({ required: true }) rtpCommitIdFromControl: FormControl;
  @Input({ required: true }) configCommitIdFromControl: FormControl;
  @Input({ required: true }) displayMode: DisplayMode;
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input() prefilledInputsToShow: string[] = [];

  protected repositoryValueNotSet$: Observable<string>;
  protected repositoryValueSet$: Observable<string>;

  isMQGQualityLevelSelected$: Observable<boolean>;
  isDQGQualityLevelSelected$: Observable<boolean>;

  forceShowRepositoryId = false;
  forceShowBusinessProcessQualityLevel = false;

  private readonly destroy$ = new Subject();

  ngOnInit(): void {
    this.initialize();

    this.repositoryValueNotSet$
      .pipe(
        tap(() => this.disableQualityLevelSelection()),
        tap(() => this.clearQualityLevelSelection()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.repositoryValueSet$
      .pipe(
        tap(() => this.enableQualityLevelSelection()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.forceShowRepositoryId =
      this.prefilledInputsToShow.includes("repositoryId");
    this.forceShowBusinessProcessQualityLevel =
      this.prefilledInputsToShow.includes("businessProcessQualityLevel");
  }

  private initialize() {
    this.initializeRepositorySelection();
    this.initializeQualityLevelSelection();
  }

  private initializeRepositorySelection() {
    this.repositoryValueNotSet$ =
      this.repositoryIdFormControl.valueChanges.pipe(
        startWith(this.repositoryIdFormControl.value),
        filter((currentRepositoryId) => !currentRepositoryId)
      );

    this.repositoryValueSet$ = this.repositoryIdFormControl.valueChanges.pipe(
      startWith(this.repositoryIdFormControl.value),
      filter((currentRepositoryId) => !!currentRepositoryId)
    );
  }

  private initializeQualityLevelSelection() {
    this.isMQGQualityLevelSelected$ =
      this.businessProcessQualityLevelFormControl.valueChanges.pipe(
        startWith(this.businessProcessQualityLevelFormControl.value),
        map(
          (currentBusinessProcessQualityLevel) =>
            currentBusinessProcessQualityLevel === "MQG"
        )
      );

    this.isDQGQualityLevelSelected$ =
      this.businessProcessQualityLevelFormControl.valueChanges.pipe(
        startWith(this.businessProcessQualityLevelFormControl.value),
        map(
          (currentBusinessProcessQualityLevel) =>
            currentBusinessProcessQualityLevel === "DQG"
        )
      );
  }

  private disableQualityLevelSelection() {
    this.businessProcessQualityLevelFormControl.disable({
      onlySelf: true,
      emitEvent: true,
    });
  }

  private enableQualityLevelSelection() {
    this.businessProcessQualityLevelFormControl.enable({
      onlySelf: true,
      emitEvent: true,
    });
  }

  private clearQualityLevelSelection() {
    this.businessProcessQualityLevelFormControl.setValue(undefined);
  }

  protected readonly DisplayMode = DisplayMode;

  ngOnDestroy() {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
