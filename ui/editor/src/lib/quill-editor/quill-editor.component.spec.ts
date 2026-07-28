import { QuillEditorComponent } from "./quill-editor.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import Toolbar from "quill/modules/toolbar";
import { of } from "rxjs";
import Uploader from "quill/modules/uploader";
import { Range } from "quill";

const link = "link";
const range = new Range(1);
const file1 = new File([new Blob(["content"], {})], "attachmentName", {
  type: "image/png",
});
const file2 = new File([new Blob(["content2"], {})], "attachmentName2", {
  type: "image/png",
});
const base64Image =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const uploadAttachmentResponse = {
  downloadLink: link,
  attachmentId: "attachmentId",
};
const imageBlotData = {
  src: uploadAttachmentResponse.downloadLink,
  attachmentId: uploadAttachmentResponse.attachmentId,
};
describe("QuillEditorComponent", () => {
  let editor: QuillEditorComponent;
  let fixture: ComponentFixture<QuillEditorComponent>;
  beforeEach(() => {
    fixture = TestBed.createComponent(QuillEditorComponent);
    editor = fixture.componentInstance;
    editor.upload = jest.fn(() => of(uploadAttachmentResponse));
    fixture.detectChanges();
    editor.sanitizer = jest.fn();
  });

  it("should default scrollable input to false", () => {
    expect(editor.isScrollable).toBeFalsy();
  });

  it("should toggle scrollable class when isScrollable is enabled", async () => {
    editor.isScrollable = true;
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    const quill = editor.quill;
    expect(quill.container.className).toContain("quill-editor-content");
    expect(quill.container.className).toContain("scrollable");
  });

  it("should show value correctly", () => {
    const value = "Value content";
    jest.spyOn(editor, "sanitizer").mockReturnValue(value);
    editor.writeValue(value);
    const contentElement = fixture.debugElement.query(
      By.css(".quill-editor-content")
    ).nativeElement;
    expect(contentElement.children[0].innerHTML).toEqual(`<p>${value}</p>`);
  });

  it("should show correct value if content is empty", () => {
    editor.value = "";
    const contentElement = fixture.debugElement.query(
      By.css(".quill-editor-content")
    ).nativeElement;
    expect(contentElement.children[0].innerHTML).toEqual("<p><br></p>");
  });

  it("should initialize quill correctly if read only", async () => {
    editor.readOnly = true;
    editor.ngAfterViewInit();
    await fixture.whenStable();
    expect(editor.quill.isEnabled()).toBeFalsy();
  });

  it("should not initialize toolbar if read only", async () => {
    editor.readOnly = true;
    editor.ngAfterViewInit();
    await fixture.whenStable();
    expect(editor.quill.getModule("toolbar")).toBeFalsy();
  });

  it("should initialize quill correctly if not read only", () => {
    editor.readOnly = false;
    expect(editor.quill.isEnabled()).toBeTruthy();
  });

  it("should initialize toolbar if not read only", () => {
    editor.readOnly = false;
    expect(editor.quill.getModule("toolbar")).toBeTruthy();
    expect(
      (editor.quill.getModule("toolbar")! as unknown as Toolbar).container!
        .className
    ).toContain("quill-editor-toolbar");
  });

  it("should set quill container correctly", () => {
    const quill = editor.quill;
    expect(quill.container.className).toContain("quill-editor-content");
  });

  it("should set value to empty if empty editor content", () => {
    const onChange = jest.spyOn(editor, "onChange");
    editor.quill.setText("abc");
    editor.quill.setText("");
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("should not consider having an image as empty", () => {
    const onChange = jest.spyOn(editor, "onChange");
    editor.quill.setText("abc");
    const image = '<p><img src="/abcd/efg"></p>';
    editor.quill.setContents(editor.quill.clipboard.convert({ html: image }));
    expect(onChange).toHaveBeenCalledWith('<p><img src="/abcd/efg"></p>');
  });

  it("should mark as touched on text change", () => {
    const onTouched = jest.spyOn(editor, "onTouched");
    editor.quill.setText("abc");
    expect(onTouched).toHaveBeenCalled();
  });

  it("should display the sanitized html value when setting initial value", async () => {
    const sanitize = jest.spyOn(editor, "sanitizer");
    const sanitizedValue = "some sanitized value";
    sanitize.mockReturnValue(sanitizedValue);

    editor.writeValue("val");
    fixture.detectChanges();
    await fixture.whenRenderingDone();

    expect(sanitize).toHaveBeenCalledWith(editor.value);
  });

  describe("uploads images through toolbar image icon and upon pasting images", () => {
    it("should add uploader in case the uploader method is passed", async () => {
      const uploadSpy = jest.spyOn(editor, "upload");
      const attachmentsUploadedEmitter = jest.spyOn(
        editor.attachmentUploaded,
        "emit"
      );
      editor.quill.insertEmbed = jest.fn();
      await (
        editor.quill.options.modules["uploader"] as {
          handler: (range: Range, files: File[]) => Promise<void>;
        }
      ).handler(range, [file1, file2]);
      expect(uploadSpy).toHaveBeenCalledWith(file1);
      expect(uploadSpy).toHaveBeenCalledWith(file2);
      expect(attachmentsUploadedEmitter).toHaveBeenCalledWith({
        name: file1.name,
        type: file1.type,
        attachmentId: uploadAttachmentResponse.attachmentId,
        downloadLink: uploadAttachmentResponse.downloadLink,
      });
      expect(attachmentsUploadedEmitter).toHaveBeenCalledWith({
        name: file2.name,
        type: file2.type,
        attachmentId: uploadAttachmentResponse.attachmentId,
        downloadLink: uploadAttachmentResponse.downloadLink,
      });
      expect(editor.quill.insertEmbed).toHaveBeenCalledWith(
        range.index,
        "imageBlot",
        imageBlotData
      );
    });
    it("should not add uploader in case the uploader method is not passed", async () => {
      editor.upload = undefined;

      editor.ngAfterViewInit();
      await fixture.whenStable();

      editor.quill.insertEmbed = jest.fn();
      expect(
        (
          editor.quill.options.modules["uploader"] as {
            handler: (range: Range, files: File[]) => Promise<void>;
          }
        ).handler
      ).toEqual(Uploader.DEFAULTS.handler);
    });
  });

  describe("paste base64 image", () => {
    it("should upload base64 image and insert it as a link", async () => {
      const uploadSpy = jest.spyOn(editor, "upload");
      const attachmentsUploadedEmitter = jest.spyOn(
        editor.attachmentUploaded,
        "emit"
      );
      const image = `<p><img src="data:image/png;base64,${base64Image}"><p/>`;
      editor.quill.clipboard.dangerouslyPasteHTML(image, "user");
      fixture.detectChanges();
      await fixture.whenRenderingDone();
      expect(editor.upload).toHaveBeenCalled();
      const file = uploadSpy.mock.calls[0][0];
      const imageType = "image/png";
      const imageName = "image.png";
      expect(file.name).toEqual(imageName);
      expect(file.type).toEqual(imageType);
      expect(file.size).toEqual(68);
      expect(attachmentsUploadedEmitter).toHaveBeenCalledWith({
        name: imageName,
        type: imageType,
        attachmentId: uploadAttachmentResponse.attachmentId,
        downloadLink: uploadAttachmentResponse.downloadLink,
      });
      expect(editor.quill.getContents().ops[0].insert).toEqual({
        imageBlot: imageBlotData,
      });
      expect(editor.quill.getContents().ops[1]).not.toEqual({
        insert: { image: `data:image/png;base64,${base64Image}` },
      });
      toBase64(file).then((base64) => {
        expect(base64).toEqual(base64Image);
      });
    });
    it("should paste the image as is if it is an image with link in src", async () => {
      const uploadSpy = jest.spyOn(editor, "upload");
      uploadSpy.mockReturnValue(of(uploadAttachmentResponse));
      const image = `<p><img src="${link}"><p/>`;
      editor.quill.clipboard.dangerouslyPasteHTML(image, "user");
      fixture.detectChanges();
      await fixture.whenRenderingDone();
      expect(editor.upload).not.toHaveBeenCalled();
      expect(editor.quill.getContents().ops[0].insert).toEqual({
        imageBlot: { src: link },
      });
    });

    it("should not upload upon pasting base64 image if no upload method is passed to the component", async () => {
      editor.upload = undefined;
      const image = `<p><img src="data:image/png;base64,${base64Image}"><p/>`;
      editor.quill.clipboard.dangerouslyPasteHTML(image, "user");
      fixture.detectChanges();
      await fixture.whenRenderingDone();
      expect(editor.quill.getContents().ops[0]).toEqual({
        insert: { imageBlot: { src: `data:image/png;base64,${base64Image}` } },
      });
    });
  });

  describe("character counter", () => {
    it("should count characters correctly", () => {
      const value = "uno";
      editor.quill.setText(value);
      const characterCount = editor.characterCount;
      expect(characterCount).toEqual(value.length);
    });
    it("should count whitespace", () => {
      const value = " j i d a r ";
      editor.quill.setText(value);
      const characterCount = editor.characterCount;
      expect(characterCount).toEqual(value.length);
    });
    it("should not count images", () => {
      const image = '<p><img src="/abcd/efg"><p/>';
      editor.quill.setContents(editor.quill.clipboard.convert({ html: image }));
      const characterCount = editor.characterCount;
      expect(characterCount).toEqual(0);
    });
    it("should not include href url in character count", () => {
      const text = "wordle";
      const link =
        `<p><a href="https://www.nytimes.com/games/wordle/index.html">` +
        text +
        `</a><p/>`;
      editor.quill.clipboard.dangerouslyPasteHTML(link, "user");
      const characterCount = editor.characterCount;
      expect(characterCount).toEqual(text.length);
    });
    it("should count characters correctly when pre-loaded with data", () => {
      const value = "initializing counter";
      jest.spyOn(editor, "sanitizer").mockReturnValue(value);
      editor.writeValue(value);
      fixture.detectChanges();
      const characterCount = editor.characterCount;
      expect(characterCount).toEqual(value.length);
    });
    it("should reflect counter change in dom", () => {
      const value = "initializing counter";
      jest.spyOn(editor, "sanitizer").mockReturnValue(value);
      editor.writeValue(value);
      fixture.detectChanges();
      const characterCounterElement = fixture.debugElement.query(
        By.css("#character-counter")
      ).nativeElement;
      const content = characterCounterElement.textContent;
      expect(content).toEqual(` Character count: ${value.length} `);
    });
  });

  describe("image blot", () => {
    it("should put image within a p tag to allow deleting images using backspace", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("abc");
      const image = '<img src="/abcd/efg">';
      editor.quill.setContents(editor.quill.clipboard.convert({ html: image }));
      expect(onChange).toHaveBeenCalledWith('<p><img src="/abcd/efg"></p>');
    });
    it.each([
      {
        downloadLink: uploadAttachmentResponse.downloadLink,
        attachmentId: uploadAttachmentResponse.attachmentId,
        result: `<p></p><p><img src="${uploadAttachmentResponse.downloadLink}" data-attachment-id="${uploadAttachmentResponse.attachmentId}"></p>`,
      },
      {
        downloadLink: null as unknown as string,
        attachmentId: uploadAttachmentResponse.attachmentId,
        result: `<p></p><p><img data-attachment-id="${uploadAttachmentResponse.attachmentId}"></p>`,
      },
      {
        downloadLink: uploadAttachmentResponse.downloadLink,
        attachmentId: null as unknown as string,
        result: `<p></p><p><img src="${uploadAttachmentResponse.downloadLink}"></p>`,
      },
      {
        downloadLink: null as unknown as string,
        attachmentId: null as unknown as string,
        result: `<p></p><p><img></p>`,
      },
    ])(
      "should add src and attachment id upon upload to the image tag",
      async ({ downloadLink, attachmentId, result }) => {
        jest
          .spyOn(editor, "upload")
          .mockReturnValue(
            of({ downloadLink: downloadLink, attachmentId: attachmentId })
          );
        const onChange = jest.spyOn(editor, "onChange");
        await (
          editor.quill.options.modules["uploader"] as {
            handler: (range: Range, files: File[]) => Promise<void>;
          }
        ).handler(range, [file1]);
        expect(onChange).toHaveBeenCalledWith(result);
      }
    );

    it.each([
      {
        image: `<p><img src="${uploadAttachmentResponse.downloadLink}" data-attachment-id="${uploadAttachmentResponse.attachmentId}"><p/>`,
        result: {
          imageBlot: {
            attachmentId: uploadAttachmentResponse.attachmentId,
            src: uploadAttachmentResponse.downloadLink,
          },
        },
      },
      {
        image: `<p><img data-attachment-id="${uploadAttachmentResponse.attachmentId}"><p/>`,
        result: {
          imageBlot: { attachmentId: uploadAttachmentResponse.attachmentId },
        },
      },
      {
        image: `<p><img src="${uploadAttachmentResponse.downloadLink}"><p/>`,
        result: {
          imageBlot: { src: uploadAttachmentResponse.downloadLink },
        },
      },
      {
        image: `<p><img><p/>`,
        result: {
          imageBlot: {},
        },
      },
    ])(
      "should add src and attachment id upon upload to the image tag",
      async ({ image, result }) => {
        editor.quill.clipboard.dangerouslyPasteHTML(image, "user");
        fixture.detectChanges();
        await fixture.whenRenderingDone();
        expect(editor.upload).not.toHaveBeenCalled();
        expect(editor.quill.getContents().ops[0].insert).toEqual(result);
      }
    );
  });

  describe("link blot", () => {
    it.each([
      {
        html: `<a href="${uploadAttachmentResponse.downloadLink}" data-attachment-id="${uploadAttachmentResponse.attachmentId}">file.pdf</a>`,
        expectedFormat: {
          href: uploadAttachmentResponse.downloadLink,
          attachmentId: uploadAttachmentResponse.attachmentId,
        },
      },
      {
        html: `<a data-attachment-id="${uploadAttachmentResponse.attachmentId}">file.pdf</a>`,
        expectedFormat: {
          attachmentId: uploadAttachmentResponse.attachmentId,
        },
      },
      {
        html: `<a href="${uploadAttachmentResponse.downloadLink}">file.pdf</a>`,
        expectedFormat: {
          href: uploadAttachmentResponse.downloadLink,
        },
      },
    ])(
      "should preserve data-attachment-id on link blot when loading description HTML",
      async ({ html, expectedFormat }) => {
        editor.quill.clipboard.dangerouslyPasteHTML(html, "user");
        fixture.detectChanges();
        await fixture.whenRenderingDone();
        const ops = editor.quill.getContents().ops;
        const linkOp = ops.find((op) => op.attributes?.["linkBlot"]);
        expect(linkOp).toBeDefined();
        expect(linkOp!.attributes!["linkBlot"]).toEqual(expectedFormat);
      }
    );
  });

  describe("retrieving html content from editor", () => {
    it("should return ordered lists in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Item 1\nItem 2");
      editor.quill.formatLine(0, editor.quill.getLength(), "list", "ordered");

      expect(onChange).toHaveBeenCalledWith(
        "<ol><li>Item&nbsp;1</li><li>Item&nbsp;2</li></ol>"
      );
    });

    it("should return unordered lists in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Item 1\nItem 2");
      editor.quill.formatLine(0, editor.quill.getLength(), "list", "bullet");

      expect(onChange).toHaveBeenCalledWith(
        "<ul><li>Item&nbsp;1</li><li>Item&nbsp;2</li></ul>"
      );
    });

    it("should return nested ordered lists in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Item 1\nNested Item 1\nItem 2");
      editor.quill.formatLine(0, editor.quill.getLength(), "list", "ordered");
      editor.quill.formatLine(7, 1, "indent", "+1");

      expect(onChange).toHaveBeenCalledWith(
        "<ol><li>Item&nbsp;1<ol><li>Nested&nbsp;Item&nbsp;1</li></ol></li><li>Item&nbsp;2</li></ol>"
      );
    });

    it("should return nested unordered lists in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Item 1\nNested Item 1\nItem 2");
      editor.quill.formatLine(0, editor.quill.getLength(), "list", "bullet");
      editor.quill.formatLine(7, 1, "indent", "+1");

      expect(onChange).toHaveBeenCalledWith(
        "<ul><li>Item&nbsp;1<ul><li>Nested&nbsp;Item&nbsp;1</li></ul></li><li>Item&nbsp;2</li></ul>"
      );
    });

    it("should return highlighted text in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Some highlighted text");
      editor.quill.formatText(5, 11, "background", "#ffff00");

      expect(onChange).toHaveBeenCalledWith(
        '<p>Some&nbsp;<span style="background-color: rgb(255, 255, 0);">highlighted</span>&nbsp;text</p>'
      );
    });

    it("should return left-aligned text in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Left aligned text");
      editor.quill.formatLine(0, editor.quill.getLength(), "align", "left");

      expect(onChange).toHaveBeenCalledWith(
        "<p>Left&nbsp;aligned&nbsp;text</p>"
      );
    });

    it("should return right-aligned text in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Right aligned text");
      editor.quill.formatLine(0, editor.quill.getLength(), "align", "right");

      expect(onChange).toHaveBeenCalledWith(
        '<p style="text-align: right;">Right&nbsp;aligned&nbsp;text</p>'
      );
    });

    it("should return justified text in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Justified text");
      editor.quill.formatLine(0, editor.quill.getLength(), "align", "justify");

      expect(onChange).toHaveBeenCalledWith(
        '<p style="text-align: justify;">Justified&nbsp;text</p>'
      );
    });

    it("should return monospace font text in standard html format", () => {
      const onChange = jest.spyOn(editor, "onChange");
      editor.quill.setText("Monospace text");
      editor.quill.formatText(
        0,
        editor.quill.getLength() - 1,
        "font",
        "monospace"
      );

      expect(onChange).toHaveBeenCalledWith(
        '<p><span style="font-family: monospace;">Monospace&nbsp;text</span></p>'
      );
    });
  });
});

const toBase64 = (file: File) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
