import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "toggleTooltip",
  standalone: true,
})
export class ToggleTooltipPipe implements PipeTransform {
  transform(excludedFromReboot: boolean | undefined): string | undefined {
    if (excludedFromReboot == undefined) {
      return undefined;
    }

    if (excludedFromReboot) {
      return "By disabling this toggle, you are including the machines of the environment in the WRP";
    }

    return "By enabling this toggle, you are excluding the machines of the environment from the WRP";
  }
}
