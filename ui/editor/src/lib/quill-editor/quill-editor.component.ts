import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  NgZone,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from "@angular/forms";
import { DomHandler } from "primeng/dom";
import { lastValueFrom, Observable } from "rxjs";
import Quill, { Delta } from "quill/core";
import { AlignStyle } from "quill/formats/align";
import { FontStyle } from "quill/formats/font";
import { Attachment } from "@mxflow/features/attachment";
import { Range } from "quill";
import DOMPurify from "dompurify";

const EDITOR_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuillEditorComponent),
  multi: true,
};

export interface UploadImageResponse {
  downloadLink: string;
  attachmentId: string;
}

@Component({
  selector: "mxevolve-quill-editor",
  providers: [EDITOR_VALUE_ACCESSOR],
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: "./quill-editor.component.html",
  styleUrls: ["./quill-editor.component.scss"],
  standalone: true,
})
export class QuillEditorComponent
  implements ControlValueAccessor, AfterViewInit
{
  @Input() readOnly = false;
  @Input() isScrollable = false;
  @Input() upload?: (file: File) => Observable<UploadImageResponse>;
  @Output() attachmentUploaded = new EventEmitter<Attachment>();

  sanitizer = DOMPurify?.sanitize;
  quill: Quill;
  value: string;
  quillEditorElementRef: ElementRef;
  characterCount = 0;

  onChange: (value: string) => void = () => {
    //initializing empty method
  };
  onTouched: () => void = () => {
    //initializing empty method
  };

  constructor(private el: ElementRef, private ngZone: NgZone) {
    this.quillEditorElementRef = el;
  }

  ngAfterViewInit(): void {
    this.ngZone.run(() => {
      import("quill").then((quillModule) => this.initializeQuill(quillModule));
    });
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

  initializeQuill(quillModule: any) {
    const options = {
      modules: {
        toolbar: this.readOnly ? false : this.getToolbarElement(),
        ...this.getImageUploader(),
      },
      readOnly: this.readOnly,
      theme: "snow",
    };

    quillModule.default.register(AlignStyle, true);
    quillModule.default.register(FontStyle, true);

    import("./image-blot/image-blot").then((imageBlotModule) => {
      quillModule.default.register(imageBlotModule.ImageBlot);
    });

    import("./link-blot/link-blot").then((linkBlotModule) => {
      quillModule.default.register(linkBlotModule.LinkBlot);
    });

    this.quill = new quillModule.default(
      this.getQuillEditorContentElement(),
      options
    );
    this.quill.clipboard.addMatcher("img", this.handlePastingBase64Images());
    this.setInitialEditorContentValue();
    this.updateCharacterCount();
    this.createListenerToUpdateFormControlValue();
  }

  // upon receiving base64 image, for example, ones from copied previous detection
  private handlePastingBase64Images() {
    return (node: Node, delta: Delta) => {
      if (node instanceof HTMLImageElement) {
        const upload = this.upload;
        if (upload && node.src.startsWith("data:image")) {
          const base64 = node.src.split(",")[1];
          this.removeBase64Image(delta);
          this.uploadAndInsertImage(upload, base64);
        }
      }
      return delta;
    };
  }

  private uploadAndInsertImage(
    upload: (file: File) => Observable<UploadImageResponse>,
    base64: string
  ) {
    const fileToUpload = this.base64ToFile(base64);
    lastValueFrom(upload(fileToUpload)).then((response) => {
      this.emitAttachmentUploaded(response, fileToUpload);
      const range = this.quill.getSelection();
      this.quill.insertEmbed(range?.index ?? 0, "imageBlot", {
        src: response.downloadLink,
        attachmentId: response.attachmentId,
      });
    });
  }

  private removeBase64Image(delta: Delta) {
    delta.ops = [];
  }

  base64ToFile(base64: string) {
    const name = `image.png`;
    const byteString = window.atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([int8Array], { type: "image/png" });
    return new File([blob], name, { type: "image/png" });
  }

  // note upon copying and pasting from word/jira the image name is being always image.png
  // upon drag and drop it takes the file name
  private getImageUploader() {
    const upload = this.upload;
    if (upload) {
      return this.initImageUploader(upload);
    } else {
      return {};
    }
  }

  private initImageUploader(
    upload: (file: File) => Observable<UploadImageResponse>
  ) {
    return {
      uploader: {
        handler: async (range: Range, files: File[]) => {
          for (const file of files) {
            const response = await this.uploadImage(upload, file);
            this.emitAttachmentUploaded(response, file);
            this.quill.insertEmbed(range.index, "imageBlot", {
              src: response.downloadLink,
              attachmentId: response.attachmentId,
            });
          }
        },
      },
    };
  }

  private async uploadImage(
    upload: (file: File) => Observable<UploadImageResponse>,
    file: File
  ) {
    return await lastValueFrom(upload(file));
  }

  private getToolbarElement() {
    return DomHandler.findSingle(
      this.quillEditorElementRef.nativeElement,
      "div.quill-editor-toolbar"
    );
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
  }

  private createListenerToUpdateFormControlValue() {
    this.quill.on("text-change", () => {
      let editorContent: string = this.getEditorContent();
      if (this.isEmptyEditorContent()) {
        editorContent = "";
      }
      this.onChange(editorContent);
      this.updateCharacterCount();
      this.onTouched();
    });
  }

  private getEditorContent() {
    return this.quill.getSemanticHTML();
  }

  private getQuillEditorContentElement() {
    return DomHandler.findSingle(
      this.quillEditorElementRef.nativeElement,
      "div.quill-editor-content"
    );
  }

  private isEmptyEditorContent() {
    const text = this.quill.getText().trim();
    const hasImages = this.quill.container.querySelectorAll("img").length > 0;
    return text === "" && !hasImages;
  }

  private updateCharacterCount() {
    this.characterCount = this.quill.getText().length - 1;
  }

  private emitAttachmentUploaded(
    response: UploadImageResponse,
    fileToUpload: File
  ) {
    this.attachmentUploaded.emit({
      ...response,
      name: fileToUpload.name,
      type: fileToUpload.type,
    });
  }
}
