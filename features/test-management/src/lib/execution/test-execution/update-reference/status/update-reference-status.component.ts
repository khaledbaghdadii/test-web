import { Component, Input } from "@angular/core";
import { UpdateReferenceStatus } from "../update-reference";

@Component({
  standalone: true,
  templateUrl: "update-reference-status.component.html",
  selector: "mxevolve-update-reference-status",
  imports: [],
})
export class UpdateReferenceStatusComponent {
  @Input({ required: true }) status: UpdateReferenceStatus;
  protected readonly UpdateReferenceStatus = UpdateReferenceStatus;
}
