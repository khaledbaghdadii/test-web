import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import {
  BipBuildIdDropdownComponent,
  BipVersionDropdownComponent,
  FactoryProductSelectionDirective,
  MxBuildIdDropdownComponent,
  MxVersionDropdownComponent,
} from "@mxevolve/domains/artifact/widget";

@Component({
  selector: "mxevolve-factory-product-input",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FactoryProductSelectionDirective,
    MxVersionDropdownComponent,
    MxBuildIdDropdownComponent,
    BipVersionDropdownComponent,
    BipBuildIdDropdownComponent,
  ],
  template: `
    <div
      mxevolveFactoryProductSelection
      [projectId]="projectId()"
      [factoryProductId]="factoryProductId()"
      (factoryProductIdChange)="factoryProductIdChange.emit($event)"
      class="grid grid-cols-6 gap-x-[16px] gap-y-[16px]"
    >
      <div class="flex flex-col gap-1 col-span-3">
        <label>MX Version <span>*</span></label>
        <mxevolve-mx-version-dropdown />
      </div>
      <div class="flex flex-col gap-1 col-span-3">
        <label>MX Build ID <span>*</span></label>
        <mxevolve-mx-build-id-dropdown />
      </div>
      <div class="flex flex-col gap-1 col-span-3">
        <label>BIP Version <span>*</span></label>
        <mxevolve-bip-version-dropdown />
      </div>
      <div class="flex flex-col gap-1 col-span-3">
        <label>BIP Build ID <span>*</span></label>
        <mxevolve-bip-build-id-dropdown />
      </div>
    </div>
  `,
})
export class FactoryProductInputComponent {
  projectId = input.required<string>();
  factoryProductId = input<string>();
  factoryProductIdChange = output<string | undefined>();
}
