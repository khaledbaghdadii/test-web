import { Component, Input } from "@angular/core";

@Component({
  selector: "mxflow-spinner",
  templateUrl: "mxflow-spinner.component.html",
  styleUrls: ["mxflow-spinner.component.scss"],
  standalone: false,
})
export class MxflowSpinnerComponent {
  @Input() isLoading: boolean = false;
  @Input() fullHeight: boolean = false;
  @Input() styleClass: string = "";
}
