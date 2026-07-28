import { Component, Input } from "@angular/core";

@Component({
  selector: "mxflow-collapsible-message",
  templateUrl: "./collapsible-message.component.html",
  styleUrls: ["./collapsible-message.component.css"],
  standalone: false,
})
export class CollapsibleMessageComponent {
  private readonly MAXIMUM_NUMBER_OF_CHARACTERS_IN_ONE_LINE = 140;

  isCollapsed = true;

  @Input() message: string;
  @Input() threshold: number = this.MAXIMUM_NUMBER_OF_CHARACTERS_IN_ONE_LINE;

  showReadMore() {
    return (
      this.message &&
      (this.messageIsLong() || this.messageSpansOnMoreThanOneLine())
    );
  }

  toggleExpansion() {
    this.isCollapsed = !this.isCollapsed;
  }

  private messageIsLong() {
    return this.message.length > this.threshold;
  }

  private messageSpansOnMoreThanOneLine() {
    return this.message.includes("\n");
  }
}
