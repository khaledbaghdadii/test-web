import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import DOMPurify from "dompurify";
import Quill from "quill/core";
import { MessageModule } from "primeng/message";

const EDITOR_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SanitizedQuillEditorComponent),
  multi: true,
};

@Component({
  selector: "mxevolve-sanitized-quill-editor",
  providers: [EDITOR_VALUE_ACCESSOR],
  templateUrl: "./sanitized-quill-editor.component.html",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardContainerModule,
    HeaderTitleModule,
    MessageModule,
  ],
})
export class SanitizedQuillEditorComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy
{
  @ViewChild("quillEditorContainer")
  quillEditorContainer: ElementRef<HTMLDivElement>;
  @ViewChild("quillEditorContent")
  quillEditorContent: ElementRef<HTMLDivElement>;
  @ViewChild("quillEditorToolbar")
  quillEditorToolbar: ElementRef<HTMLDivElement>;

  @Output() limitStateChange = new EventEmitter<{
    lineLimit: boolean;
  }>();

  sanitizer = DOMPurify?.sanitize;
  quill: Quill;
  value: string;
  characterCount = 0;
  lineCount = 0;

  private readonly CHAR_LIMIT = 650;
  private readonly LINE_LIMIT = 2;
  charLimitReached = false;
  lineLimitWarningVisible = false;
  private lineLimitWarningTimeout: ReturnType<typeof setTimeout>;

  onChange: (value: string) => void = () => {
    //initializing empty method
  };
  onTouched: () => void = () => {
    //initializing empty method
  };

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    if (this.lineLimitWarningTimeout) {
      clearTimeout(this.lineLimitWarningTimeout);
    }
  }

  writeValue(value: string): void {
    this.value = value;
    if (this.quill) {
      this.setContents(this.value);
    }
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  ngAfterViewInit(): void {
    this.ngZone.run(() => {
      import("quill").then((quillModule) => this.initializeQuill(quillModule));
    });
  }

  private initializeQuill(quillModule: typeof import("quill")) {
    const options = {
      modules: {
        toolbar: this.quillEditorToolbar.nativeElement,
      },
      readOnly: false,
      theme: "snow",
    };

    this.quill = new quillModule.default(
      this.quillEditorContent.nativeElement,
      options
    );

    this.setInitialEditorContentValue();
    this.updateCharacterCount();
    this.updateLineCount();
    this.createListenerToUpdateFormControlValue();
  }

  private setInitialEditorContentValue() {
    if (this.value) {
      this.setContents(this.value);
    }
  }

  private setContents(value: string) {
    this.quill.setContents(
      this.quill.clipboard.convert({ html: this.sanitizer(value) })
    );
    this.updateCharacterCount();
    this.updateLineCount();
  }

  private createListenerToUpdateFormControlValue() {
    this.quill.on("text-change", () => {
      this.handleWarnings();

      let editorContent: string = this.quill.root.innerHTML;

      if (this.isEmptyEditorContent()) {
        editorContent = "";
      }
      this.onChange(editorContent);
      this.updateLineCount();
      this.updateCharacterCount();
      this.onTouched();
    });
  }

  private isEmptyEditorContent() {
    const text = this.quill.getText().trim();
    return text === "";
  }

  private updateCharacterCount() {
    this.characterCount = this.quill.getText().length - 1;
  }

  private updateLineCount() {
    this.lineCount = this.quill.getLines().length;
  }

  private handleWarnings() {
    this.handleLineWarnings();
    this.charLimitReached = this.quill.getLength() > this.CHAR_LIMIT;

    if (this.charLimitReached || this.lineLimitWarningVisible) {
      this.quill.deleteText(this.CHAR_LIMIT, this.quill.getLength());
    }
  }

  private handleLineWarnings() {
    const lines = this.quill.getLines();
    if (lines.length > this.LINE_LIMIT) {
      const lastAllowedLine = lines[this.LINE_LIMIT - 1];
      if (!lastAllowedLine) return;

      const lastAllowedLineStart = this.quill.getIndex(lastAllowedLine);
      const lastAllowedLineEnd =
        lastAllowedLineStart + lastAllowedLine.length();

      this.quill.deleteText(
        lastAllowedLineEnd,
        this.quill.getLength() - lastAllowedLineEnd
      );
      this.lineLimitWarningVisible = true;

      if (this.lineLimitWarningTimeout) {
        clearTimeout(this.lineLimitWarningTimeout);
      }

      this.lineLimitWarningTimeout = setTimeout(() => {
        this.lineLimitWarningVisible = false;
      }, 3000);
    }
  }
}
