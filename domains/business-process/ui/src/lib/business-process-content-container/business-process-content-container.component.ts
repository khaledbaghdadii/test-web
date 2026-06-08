import {
  Component,
  computed,
  input,
  TemplateRef,
  viewChild,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { PanelModule } from "primeng/panel";
import { Divider } from "primeng/divider";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { CommonModule } from "@angular/common";

@Component({
  selector: "mxevolve-business-process-content-container",
  templateUrl: "./business-process-content-container.component.html",
  imports: [
    CardModule,
    PanelModule,
    Divider,
    MxevolveIconComponent,
    CommonModule,
  ],
  host: {
    style: "display: contents;",
    class: "bp-section-container",
  },
})
export class BusinessProcessContentContainerComponent {
  readonly clearBackground = input<boolean>(false);
  readonly collapsable = input<boolean>(false);
  readonly collapsed = input<boolean>(false);
  readonly header = input<string>();

  // Alias needed because PrimeNG's <ng-template #header> shadows the input signal inside that scope
  readonly panelTitle = computed(() => this.header());

  readonly clearBackgroundTemplate =
    viewChild<TemplateRef<HTMLElement>>("clearBackground");
  readonly panelTemplate = viewChild<TemplateRef<HTMLElement>>("panel");
  readonly cardTemplate = viewChild<TemplateRef<HTMLElement>>("card");

  readonly outlet = computed(() => {
    if (this.clearBackground()) {
      return this.clearBackgroundTemplate();
    }
    if (this.collapsable()) {
      return this.panelTemplate();
    }
    return this.cardTemplate();
  });
}
