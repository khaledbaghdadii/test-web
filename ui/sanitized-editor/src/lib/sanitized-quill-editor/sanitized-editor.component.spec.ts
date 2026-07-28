import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { SanitizedQuillEditorComponent } from "@mxflow/ui/sanitized-editor";

describe("SanitizedQuillEditorComponent", () => {
  let editor: SanitizedQuillEditorComponent;
  let fixture: ComponentFixture<SanitizedQuillEditorComponent>;
  beforeEach(() => {
    fixture = TestBed.createComponent(SanitizedQuillEditorComponent);
    editor = fixture.componentInstance;
    fixture.detectChanges();
    editor.sanitizer = jest.fn();
  });

  it("should clear lineLimitWarningTimeout on destroy", () => {
    const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
    editor["lineLimitWarningTimeout"] = setTimeout(() => {}, 3000);

    editor.ngOnDestroy();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(
      editor["lineLimitWarningTimeout"]
    );
  });

  it("should show value correctly", () => {
    const value = "Value content";
    jest.spyOn(editor, "sanitizer").mockReturnValue(value);

    editor.writeValue(value);
    fixture.detectChanges();

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

  it("should set quill container correctly", () => {
    const quill = editor.quill;
    expect(quill.container.className).toContain("quill-editor-content");
  });

  it("should set value to empty if empty editor content", () => {
    const onChange = jest.spyOn(editor, "onChange");
    editor.quill.setText("abc");
    editor.quill.setText("           ");
    expect(onChange).toHaveBeenCalledWith("");
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
    expect(editor.characterCount).toBe(sanitizedValue.length);
    expect(editor.lineCount).toBeGreaterThanOrEqual(1);
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

    it("should truncate text exceeding character limit", () => {
      const longText = "a".repeat(700);
      editor.quill.setText(longText);
      const truncatedText = editor.quill.getText().trim();
      expect(truncatedText.length).toEqual(650);
    });

    it("should not allow character count to exceed limit", () => {
      const longText = "a".repeat(700);
      editor.quill.setText(longText);
      expect(editor.characterCount).toEqual(650);
    });
  });

  describe("handleWarnings", () => {
    it("should add 'text-red-500' to character counter when char limit is reached", () => {
      const longText = "a".repeat(700);
      editor.quill.setText(longText);
      fixture.detectChanges();

      const charCounterElement = fixture.debugElement.query(
        By.css('[data-test-id="charLimitReached"]')
      ).nativeElement;

      expect(charCounterElement.classList.contains("text-red-500")).toBe(true);
    });

    it("should add 'text-red-500' to line counter when line limit is reached", fakeAsync(() => {
      editor.quill.setText("line1\nline2\nline3");
      fixture.detectChanges();

      const lineCounterElement = fixture.debugElement.query(
        By.css('[data-test-id="lineLimitReached"]')
      ).nativeElement;

      expect(lineCounterElement.classList.contains("text-red-500")).toBe(true);
    }));
  });
});
