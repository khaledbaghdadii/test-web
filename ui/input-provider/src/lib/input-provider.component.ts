import { Component, Input } from "@angular/core";

@Component({
  selector: "mxflow-input-provider",
  templateUrl: "./input-provider.component.html",
  standalone: false,
})
export class InputProviderComponent {
  @Input() requester: string;
}
