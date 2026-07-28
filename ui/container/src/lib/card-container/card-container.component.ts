import { Component, Input } from "@angular/core";

@Component({
  selector: "mxevolve-card-container",
  templateUrl: "./card-container.component.html",
  styleUrls: ["./card-container.component.css"],
  standalone: false,
})
export class CardContainerComponent {
  @Input() fullHeight = false;
  @Input() innerContentClass: string;
}
