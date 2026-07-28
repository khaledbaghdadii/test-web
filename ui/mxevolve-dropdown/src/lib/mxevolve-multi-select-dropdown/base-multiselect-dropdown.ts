import { forwardRef, output, ViewChild, Directive, Type } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MxevolveMultiselectDropdownComponent } from "./mxevolve-multiselect-dropdown.component";
import { MxEvolveDropdownState } from "../models/dropdown-state.interface";

/**
 * Base class for multiselect dropdown components that implement ControlValueAccessor.
 * Provides all the boilerplate for ControlValueAccessor and integrates with MxevolveMultiselectDropdownComponent.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-users-dropdown',
 *   template: `
 *     <mxevolve-multiselect-dropdown
 *       [stateService]="stateService"
 *       [dataParams]="{ projectId: projectId() }"
 *       [config]="dropdownConfig"
 *       (selectionChange)="onSelectionChange($event)"
 *       (errorEvent)="onError($event)"
 *     />
 *   `,
 *   providers: [
 *     ...BaseMultiselectDropdown.createProviders(UsersDropdownComponent)
 *   ]
 * })
 * export class UsersDropdownComponent extends BaseMultiselectDropdown<User, { projectId: string }> {
 *   projectId = input.required<string>();
 *   protected readonly stateService: MxEvolveDropdownState<User>;
 *
 *   constructor() {
 *     const destroyRef = inject(DestroyRef);
 *     const dataProvider = new UsersDataProvider(inject(UsersService));
 *     this.stateService = new MxEvolveDropdownStateService(dataProvider, destroyRef);
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseMultiselectDropdown<T, TParams>
  implements ControlValueAccessor
{
  /**
   * Event emitted when an error occurs during data fetching
   */
  failureEvent = output<string>();

  /**
   * Reference to the inner dropdown component
   */
  @ViewChild(MxevolveMultiselectDropdownComponent)
  dropdownComponent?: MxevolveMultiselectDropdownComponent<T, TParams>;

  /**
   * State service must be provided by the extending class
   */
  protected abstract readonly stateProvider: MxEvolveDropdownState<T, TParams>;

  private onChange: (value: T[]) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Helper method to create the NG_VALUE_ACCESSOR provider
   * Use this in your component's providers array
   */
  static createProviders<T>(componentType: Type<T>) {
    return [
      {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => componentType),
        multi: true,
      },
    ];
  }

  writeValue(value: T[]): void {
    if (this.dropdownComponent) {
      this.dropdownComponent.writeValue(value);
    }
  }

  registerOnChange(fn: (value: T[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(): void {
    // Override if you need to handle disabled state
  }

  /**
   * Called when selection changes in the dropdown
   * Override if you need custom logic
   */
  onSelectionChange(selectedItems: T[]): void {
    this.onChange(selectedItems);
    this.onTouched();
  }

  /**
   * Called when an error occurs
   * Override if you need custom error handling
   */
  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }
}
