import {
  Component,
  ViewEncapsulation,
  ViewChild,
  Input,
  Output,
  AfterViewInit,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { AutoCompleteModule, AutoComplete } from "primeng/autocomplete";

@Component({
  selector: "mxevolve-multi-tags-input",
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  templateUrl: "./multi-tags-input.component.html",
  styleUrls: ["./multi-tags-input.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class MultiTagsInputComponent implements AfterViewInit, OnChanges {
  @ViewChild("autoComp") autoComp!: AutoComplete;

  @Input() tags: string[] = [];
  @Input() placeholder: string = "";
  @Input() disabled: boolean = false;

  @Output() tagsChange = new EventEmitter<string[]>();

  ngAfterViewInit(): void {
    this.updatePaddingAndScroll(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["tags"] && this.tags.length <= 1) {
      this.updatePaddingAndScroll(true);
    }
  }

  private updatePaddingAndScroll(resetScroll: boolean = false): void {
    if (!this.autoComp) {
      return;
    }

    requestAnimationFrame(() => {
      const autoComplete = this.autoComp?.el?.nativeElement?.querySelector(
        ".p-autocomplete-input-multiple"
      );

      if (!autoComplete) {
        return;
      }

      const hasScroll = autoComplete.scrollWidth > autoComplete.clientWidth;

      // Set padding based on scroll visibility
      if (hasScroll) {
        autoComplete.style.paddingTop = "0";
        autoComplete.style.paddingBottom = "0";

        if (resetScroll) {
          autoComplete.scrollLeft = 0;
          return;
        }

        if (this.disabled) {
          return;
        }

        // Auto-scroll to show the input field
        const inputElement = autoComplete.querySelector("input");
        if (inputElement) {
          const inputRect = inputElement.getBoundingClientRect();
          const containerRect = autoComplete.getBoundingClientRect();

          if (
            inputRect.right > containerRect.right - 35 ||
            inputRect.left < containerRect.left
          ) {
            const scrollPosition =
              inputElement.offsetLeft -
              autoComplete.clientWidth +
              inputElement.offsetWidth +
              45;
            autoComplete.scrollLeft = Math.max(0, scrollPosition);
          }
        }
      } else {
        autoComplete.style.paddingTop = "";
        autoComplete.style.paddingBottom = "";
      }
    });
  }

  onTagsChange(newTags: string[]): void {
    const filteredTags = (newTags || []).filter(
      (tag) => tag != null && typeof tag === "string" && tag.trim().length > 0
    );

    if (JSON.stringify(this.tags) !== JSON.stringify(filteredTags)) {
      this.tagsChange.emit(filteredTags);
    }

    this.tags = filteredTags;
    this.updatePaddingAndScroll(false);
  }

  clearAll(): void {
    this.tags = [];
    this.tagsChange.emit([]);
    this.updatePaddingAndScroll(true);
  }
}
