import { forwardRef, output, ViewChild, Directive, Type } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MxevolveSingleSelectDropdownComponent } from "./mxevolve-single-select-dropdown.component";
import { MxEvolveSingleSelectDropdownState } from "../models/single-select-dropdown-state.interface";

/**
 * Base class for single-select dropdown components that implement ControlValueAccessor.
 * Provides all the boilerplate for ControlValueAccessor and integrates with MxevolveSingleSelectDropdownComponent.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-user-dropdown',
 *   template: `
 *     <mxevolve-single-select-dropdown
 *       [stateProvider]="stateProvider"
 *       [dataParams]="{ projectId: projectId() }"
 *       [config]="dropdownConfig"
 *       (selectionChange)="onSelectionChange($event)"
 *       (errorEvent)="onError($event)"
 *     />
 *   `,
 *   providers: [
 *     ...BaseSingleSelectDropdown.createProviders(UserDropdownComponent)
 *   ]
 * })
 * export class UserDropdownComponent extends BaseSingleSelectDropdown<User, { projectId: string }> {
 *   projectId = input.required<string>();
 *   protected readonly stateProvider: MxEvolveSingleSelectDropdownState<User>;
 *
 *   constructor() {
 *     const destroyRef = inject(DestroyRef);
 *     const dataProvider = new UserDataProvider(inject(UserService));
 *     this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(dataProvider, destroyRef);
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseSingleSelectDropdown<T, TParams>
  implements ControlValueAccessor
{
  /**
   * Event emitted when an error occurs during data fetching
   */
  failureEvent = output<string>();

  /**
   * Reference to the inner dropdown component
   */
  @ViewChild(MxevolveSingleSelectDropdownComponent)
  dropdownComponent?: MxevolveSingleSelectDropdownComponent<T, TParams>;

  /**
   * State provider must be provided by the extending class
   */
  protected abstract readonly stateProvider: MxEvolveSingleSelectDropdownState<
    T,
    TParams
  >;

  private onChange: (value: T | null) => void = () => {};
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

  writeValue(value: T | null): void {
    if (this.dropdownComponent) {
      this.dropdownComponent.writeValue(value);
    }
  }

  registerOnChange(fn: (value: T | null) => void): void {
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
  onSelectionChange(selectedItem: T | null): void {
    this.onChange(selectedItem);
    this.onTouched();
  }

  /**
   * Called when an error occurs
   * Override if you need custom error handling
   */
  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  /**
   * Hides the dropdown overlay if it's currently open.
   * Useful for programmatically closing the dropdown when the parent form/dialog is closed.
   */
  hideDropdown(): void {
    this.dropdownComponent?.selectRef?.hide();
  }
}
