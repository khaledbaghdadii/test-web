import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "mxevolve-comment-input",
  template: `<textarea
    pTextarea
    #commentInput
    fluid
    rows="3"
    class="w-full"
    [(ngModel)]="comment"
    (ngModelChange)="updateCommentEventEmitter.emit($event)"
  >
  </textarea>`,
  standalone: false,
})
export class CommentInputComponent {
  @Input() comment = "";
  @Output() updateCommentEventEmitter: EventEmitter<string> =
    new EventEmitter<string>();
  @Input() projectId: string;
  @Input() scenarioExecutionId: string;
}
