import {
  Component,
  forwardRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { MultiSelectModule } from "primeng/multiselect";
import {
  ClientImpactNoteOption,
  ClientImpactNoteFieldType,
  ClientImpactNoteService,
} from "@mxevolve/domains/test/data-access";
import { Subject, takeUntil } from "rxjs";
import { Skeleton } from "primeng/skeleton";
import { ListUtils } from "../../utils/list-utils";

@Component({
  selector: "mxevolve-client-impact-note-multiselect-dropdown",
  standalone: true,
  imports: [FormsModule, MultiSelectModule, Skeleton],
  templateUrl: "./client-impact-note-multiselect-dropdown.component.html",
  styleUrls: [],
  providers: [
    ClientImpactNoteService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(
        () => ClientImpactNoteMultiSelectDropdownComponent
      ),
      multi: true,
    },
  ],
})
export class ClientImpactNoteMultiSelectDropdownComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  private readonly destroy$ = new Subject();
  selectedDropdownValues: string[] = [];
  validateAndUpdateValueFromParentForm = new Subject<string[]>();
  options: ClientImpactNoteOption[] = [];
  loading: boolean = true;
  onTouched = () => {};
  onChange: (input: string[]) => void = () => {};
  clientImpactNoteService = inject(ClientImpactNoteService);
  @Input() placeholder: string = "Select options";
  @Input() fieldType: ClientImpactNoteFieldType;
  @Input() invalid = false;

  ngOnInit() {
    this.validateAndUpdateValueFromParentForm
      .pipe(takeUntil(this.destroy$))
      .subscribe((valuesPrefilledFromParentForm) => {
        const validValuesPrefilledFromParentForm = !this.loading
          ? this.extractValidSelectedOptions(valuesPrefilledFromParentForm)
          : valuesPrefilledFromParentForm;
        if (
          !ListUtils.arePermutations(
            valuesPrefilledFromParentForm,
            validValuesPrefilledFromParentForm
          )
        ) {
          this.onChange(validValuesPrefilledFromParentForm);
        }
        this.selectedDropdownValues = validValuesPrefilledFromParentForm;
      });
    this.clientImpactNoteService
      .fetch(this.fieldType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((fieldValues) => {
        this.options = fieldValues;
      })
      .add(() => {
        this.loading = false;
        this.validateAndUpdateValueFromParentForm.next(
          this.selectedDropdownValues
        );
      });
  }

  private extractValidSelectedOptions(selectedDropdownOptions: string[]) {
    const validOptionIds = this.options.map((option) => option.id);
    return selectedDropdownOptions.filter((optionId) =>
      validOptionIds.includes(optionId)
    );
  }

  writeValue(valueFromParentForm: string[] | null): void {
    this.validateAndUpdateValueFromParentForm.next(valueFromParentForm || []);
  }

  registerOnChange(fn: (input: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onValueChange(values: string[]) {
    this.selectedDropdownValues = values;
    this.onChange(values);
  }

  ngOnDestroy() {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
