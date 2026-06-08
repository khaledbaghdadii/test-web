import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  FileManagementSourceTreeAddDialogComponent,
  SourceTreeAddRequest,
} from "./add-dialog.component";

describe("FileManagementSourceTreeAddDialogComponent", () => {
  let fixture: ComponentFixture<FileManagementSourceTreeAddDialogComponent>;
  let component: FileManagementSourceTreeAddDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileManagementSourceTreeAddDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      FileManagementSourceTreeAddDialogComponent
    );
    component = fixture.componentInstance;
  });

  describe("dialogHeader", () => {
    it("Should_ShowTypeAndRootLocation_When_NoParentPathProvided", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.detectChanges();

      expect(component.dialogHeader()).toBe("Create new file at root");
    });

    it("Should_ShowTypeAndParentPath_When_ParentPathProvided", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.componentRef.setInput("parentPath", "src/utils");
      fixture.detectChanges();

      expect(component.dialogHeader()).toBe("Create new file inside src/utils");
    });

    it("Should_UpdateHeader_When_TypeChangedToDirectory", () => {
      fixture.componentRef.setInput("visible", true);
      fixture.componentRef.setInput("parentPath", "src");
      component.selectedType.set("directory");
      fixture.detectChanges();

      expect(component.dialogHeader()).toBe("Create new directory inside src");
    });
  });

  describe("onCreate", () => {
    it("Should_EmitAddRequested_When_NameIsProvided", () => {
      const emitted: SourceTreeAddRequest[] = [];
      fixture.componentRef.setInput("visible", true);
      component.addRequested.subscribe((r) => emitted.push(r));
      component.name.set("my-file.txt");
      fixture.detectChanges();

      component.onCreate();

      expect(emitted).toEqual([{ type: "file", name: "my-file.txt" }]);
    });

    it("Should_NotEmit_When_NameIsBlank", () => {
      const emitted: SourceTreeAddRequest[] = [];
      fixture.componentRef.setInput("visible", true);
      component.addRequested.subscribe((r) => emitted.push(r));
      component.name.set("   ");
      fixture.detectChanges();

      component.onCreate();

      expect(emitted).toHaveLength(0);
    });

    it("Should_ResetState_When_Created", () => {
      fixture.componentRef.setInput("visible", true);
      component.name.set("my-dir");
      component.selectedType.set("directory");
      fixture.detectChanges();

      component.onCreate();

      expect(component.name()).toBe("");
      expect(component.selectedType()).toBe("file");
    });
  });

  describe("onCancel", () => {
    it("Should_EmitCancelled_When_Cancelled", () => {
      let cancelled = false;
      fixture.componentRef.setInput("visible", true);
      component.cancelled.subscribe(() => (cancelled = true));
      fixture.detectChanges();

      component.onCancel();

      expect(cancelled).toBe(true);
    });

    it("Should_ResetState_When_Cancelled", () => {
      fixture.componentRef.setInput("visible", true);
      component.name.set("some-name");
      component.selectedType.set("directory");
      fixture.detectChanges();

      component.onCancel();

      expect(component.name()).toBe("");
      expect(component.selectedType()).toBe("file");
    });
  });

  describe("onVisibleChange", () => {
    it("Should_EmitCancelledAndReset_When_DialogClosedExternally", () => {
      let cancelled = false;
      fixture.componentRef.setInput("visible", true);
      component.cancelled.subscribe(() => (cancelled = true));
      component.name.set("temp");
      fixture.detectChanges();

      component.onVisibleChange(false);

      expect(cancelled).toBe(true);
      expect(component.name()).toBe("");
    });

    it("Should_DoNothing_When_DialogOpened", () => {
      let cancelled = false;
      component.cancelled.subscribe(() => (cancelled = true));

      component.onVisibleChange(true);

      expect(cancelled).toBe(false);
    });
  });
});
