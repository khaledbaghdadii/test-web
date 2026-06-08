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
import {
  ClientImpactNoteOption,
  ClientImpactNoteFieldType,
  ClientImpactNoteService,
} from "@mxevolve/domains/test/data-access";
import { Subject, takeUntil } from "rxjs";
import { Skeleton } from "primeng/skeleton";
import { Select } from "primeng/select";

@Component({
  selector: "mxevolve-client-impact-note-single-select-dropdown",
  standalone: true,
  imports: [FormsModule, Skeleton, Select],
  templateUrl: "./client-impact-note-single-select-dropdown.component.html",
  styleUrls: [],
  providers: [
    ClientImpactNoteService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(
        () => ClientImpactNoteSingleSelectDropdownComponent
      ),
      multi: true,
    },
  ],
})
export class ClientImpactNoteSingleSelectDropdownComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  private readonly destroy$ = new Subject();
  selectedValue: string | null = null;
  validateAndUpdateValueFromParentForm = new Subject<string | null>();
  options: ClientImpactNoteOption[] = [];
  loading: boolean = true;
  onTouched = () => {};
  onChange: (input: string | null) => void = () => {};
  clientImpactNoteService = inject(ClientImpactNoteService);
  @Input() placeholder: string = "Select option";
  @Input() fieldType: ClientImpactNoteFieldType;
  @Input() invalid = false;

  ngOnInit() {
    this.validateAndUpdateValueFromParentForm
      .pipe(takeUntil(this.destroy$))
      .subscribe((valuePrefilledFromParentForm) => {
        const validValuePrefilledFromParentForm = !this.loading
          ? this.extractValidSelectedOption(valuePrefilledFromParentForm)
          : valuePrefilledFromParentForm;
        if (valuePrefilledFromParentForm != validValuePrefilledFromParentForm) {
          this.onChange(validValuePrefilledFromParentForm);
        }
        this.selectedValue = validValuePrefilledFromParentForm;
      });

    this.clientImpactNoteService
      .fetch(this.fieldType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((fieldValues) => {
        this.options = fieldValues;
      })
      .add(() => {
        this.loading = false;
        this.validateAndUpdateValueFromParentForm.next(this.selectedValue);
      });
  }

  private extractValidSelectedOption(
    selectedOptionId: string | null
  ): string | null {
    if (selectedOptionId == null) return null;
    const validOptionIds = this.options.map((option) => option.id);
    return validOptionIds.includes(selectedOptionId) ? selectedOptionId : null;
  }

  writeValue(valueFromParentForm: string | null): void {
    this.validateAndUpdateValueFromParentForm.next(valueFromParentForm);
  }

  registerOnChange(fn: (input: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onValueChange(value: string | null) {
    this.selectedValue = value;
    this.onChange(value);
  }

  ngOnDestroy() {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
