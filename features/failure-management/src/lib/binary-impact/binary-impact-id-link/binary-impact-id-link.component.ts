import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  imports: [RouterLink],
  selector: "mxevolve-binary-impact-id-link",
  templateUrl: "./binary-impact-id-link.component.html",
  standalone: true,
})
export class BinaryImpactIdLinkComponent {
  @Input() binaryImpactId: string;
  @Input() readableId: string;
  @Input() projectId?: string;
}
