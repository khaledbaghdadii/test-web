import { Component, Input } from "@angular/core";
import { SlicePipe } from "@angular/common";

@Component({
  selector: "mxevolve-show-more-less-text",
  templateUrl: "show-more-less-text.component.html",
  imports: [SlicePipe],
  standalone: true,
})
export class ShowMoreLessTextComponent {
  @Input() text = "";
  @Input() maxLength = 40;
  isExpanded = false;

  toggle(event: Event) {
    event.preventDefault();
    this.isExpanded = !this.isExpanded;
  }
}
