import { Component, computed, input, signal } from "@angular/core";
import { Dialog } from "primeng/dialog";

const MESSAGE_TRUNCATION_LENGTH = 80;

@Component({
  selector: "mxevolve-expandable-message",
  standalone: true,
  imports: [Dialog],
  templateUrl: "./expandable-message.component.html",
})
export class ExpandableMessageComponent {
  readonly message = input.required<string>();
  readonly triggerAriaLabel = input("See full message");

  readonly dialogVisible = signal(false);

  readonly displayedMessage = computed(() => {
    const message = this.message();
    return message.length > MESSAGE_TRUNCATION_LENGTH
      ? `${message.substring(0, MESSAGE_TRUNCATION_LENGTH)}...`
      : message;
  });

  readonly isMessageTruncated = computed(
    () => this.message().length > MESSAGE_TRUNCATION_LENGTH
  );

  showFullMessage(): void {
    this.dialogVisible.set(true);
  }
}
