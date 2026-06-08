import { Component, input } from "@angular/core";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { MxevolveIllustrationComponent } from "@mxevolve/shared/ui/primitive";
import { Card } from "primeng/card";
import { Divider } from "primeng/divider";

@Component({
  selector: "mxevolve-tag-stage",
  templateUrl: "./tag-stage.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [
    MxevolveIllustrationComponent,
    Card,
    Divider,
    StageContainerComponent,
    BusinessProcessContentContainerComponent,
  ],
})
export class TagStageComponent {
  readonly tagName = input.required<string>();
  readonly taggedCommitId = input.required<string>();
}
