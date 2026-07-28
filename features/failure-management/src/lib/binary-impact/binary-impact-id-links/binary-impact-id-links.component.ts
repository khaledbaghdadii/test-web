import { Component, Input } from "@angular/core";
import { BinaryImpactIdLinkComponent } from "../binary-impact-id-link/binary-impact-id-link.component";

export interface BinaryImpactLink {
  binaryImpactId: string;
  readableId: string;
  projectId?: string;
}

@Component({
  imports: [BinaryImpactIdLinkComponent],
  selector: "mxevolve-binary-impact-id-links",
  templateUrl: "./binary-impact-id-links.component.html",
  standalone: true,
})
export class BinaryImpactIdLinksComponent {
  @Input() impacts: BinaryImpactLink[] = [];
  @Input() defaultProjectId?: string;
}
