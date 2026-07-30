import { Component, OnInit, input } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import {
  InputAccessMode,
  shouldShowInForm,
} from "@mxevolve/domains/business-process/util";

/**
 * Groups a set of definition inputs under a heading. Like the fields it
 * contains, the group decides once on creation whether it is shown, and stays
 * that way; projected content is instantiated either way.
 */
@Component({
  selector: "mxevolve-definition-input-group",
  standalone: true,
  styles: [":host { display: contents; }"],
  template: `
    @if (shouldShow) {
    <fieldset class="flex flex-col gap-3 border-none p-0 m-0">
      <legend
        class="text-[0.95rem] font-bold text-primary p-0"
        [class.required]="required()"
      >
        {{ label() }}
      </legend>
      <ng-content />
    </fieldset>
    }
  `,
})
export class DefinitionInputGroupComponent implements OnInit {
  readonly label = input.required<string>();
  readonly controls = input.required<readonly AbstractControl[]>();
  readonly inputAccessMode = input.required<InputAccessMode>();
  readonly forceShow = input(false);
  readonly required = input(false);

  protected shouldShow = false;

  ngOnInit(): void {
    this.shouldShow =
      this.forceShow() ||
      this.controls().some((control) =>
        shouldShowInForm(control, this.inputAccessMode())
      );
  }
}
