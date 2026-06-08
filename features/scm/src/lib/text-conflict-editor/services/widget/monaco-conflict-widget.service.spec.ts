import type {
  ConflictBlock,
  ConflictResolution,
} from "../../models/conflict.models";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { MonacoConflictWidgetService } from "./monaco-conflict-widget.service";

describe("MonacoConflictWidgetService", () => {
  let service: MonacoConflictWidgetService;
  type WidgetEditor = Parameters<
    MonacoConflictWidgetService["createWidgets"]
  >[0];
  type ViewZoneAccessor = monaco.editor.IViewZoneChangeAccessor;
  type EditorMock = WidgetEditor & {
    addContentWidget: jest.MockedFunction<WidgetEditor["addContentWidget"]>;
    removeContentWidget: jest.MockedFunction<
      WidgetEditor["removeContentWidget"]
    >;
    changeViewZones: jest.MockedFunction<WidgetEditor["changeViewZones"]>;
    __zones: {
      addZone: jest.Mock;
      removeZone: jest.Mock;
    };
  };

  beforeEach(() => {
    service = new MonacoConflictWidgetService();
  });

  const createBlock = (id: string, start = 1): ConflictBlock => ({
    id,
    start,
    end: start + 4,
    startOffset: 0,
    endOffset: 0,
    current: "ours",
    incoming: "theirs",
    raw: "raw",
  });

  const createEditorMock = () => {
    let zoneCounter = 0;
    const addZone = jest.fn().mockImplementation(() => `zone-${++zoneCounter}`);
    const removeZone = jest.fn();
    const addContentWidget = jest.fn() as jest.MockedFunction<
      WidgetEditor["addContentWidget"]
    >;
    const removeContentWidget = jest.fn() as jest.MockedFunction<
      WidgetEditor["removeContentWidget"]
    >;
    const changeViewZones = jest.fn(
      (cb: (accessor: ViewZoneAccessor) => void) =>
        cb({ addZone, removeZone } as unknown as ViewZoneAccessor)
    ) as jest.MockedFunction<WidgetEditor["changeViewZones"]>;

    return {
      addContentWidget,
      removeContentWidget,
      changeViewZones,
      __zones: {
        addZone,
        removeZone,
      },
    } as unknown as EditorMock;
  };

  describe("createWidgets", () => {
    it("should register one widget per block when blocks are provided", () => {
      const editor = createEditorMock();
      const blocks = [createBlock("a", 10), createBlock("b", 20)];
      const onResolve = jest.fn();

      service.createWidgets(editor, blocks, onResolve);

      expect(editor.addContentWidget).toHaveBeenCalledTimes(2);
      const firstWidget = editor.addContentWidget.mock.calls[0][0];
      const secondWidget = editor.addContentWidget.mock.calls[1][0];
      expect(firstWidget.getId()).toBe("conflict-widget-a");
      expect(secondWidget.getId()).toBe("conflict-widget-b");
    });

    it("should remove old widgets before adding new ones when createWidgets is called again", () => {
      const editor = createEditorMock();

      service.createWidgets(editor, [createBlock("a")], jest.fn());
      service.createWidgets(editor, [createBlock("b")], jest.fn());

      expect(editor.removeContentWidget).toHaveBeenCalledTimes(1);
      expect(editor.addContentWidget).toHaveBeenCalledTimes(2);
      const latestWidget = editor.addContentWidget.mock.calls[1][0];
      expect(latestWidget.getId()).toBe("conflict-widget-b");
    });
  });

  describe("clearWidgets", () => {
    it("should not call removeContentWidget when no widgets exist", () => {
      const editor = createEditorMock();

      service.clearWidgets(editor);

      expect(editor.removeContentWidget).not.toHaveBeenCalled();
      expect(editor.changeViewZones).not.toHaveBeenCalled();
    });

    it("should remove all existing widgets when clearWidgets is called after createWidgets", () => {
      const editor = createEditorMock();
      service.createWidgets(
        editor,
        [createBlock("x"), createBlock("y")],
        jest.fn()
      );

      service.clearWidgets(editor);

      expect(editor.removeContentWidget).toHaveBeenCalledTimes(2);
      expect(editor.__zones.removeZone).toHaveBeenCalledTimes(2);
    });
  });

  describe("view zones", () => {
    it("should add one view zone per conflict block with reserved space before HEAD line", () => {
      const editor = createEditorMock();
      const blocks = [createBlock("a", 10), createBlock("b", 1)];

      service.createWidgets(editor, blocks, jest.fn());

      expect(editor.__zones.addZone).toHaveBeenCalledTimes(2);
      expect(editor.__zones.addZone).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          afterLineNumber: 9,
          heightInPx: 26,
        })
      );
      expect(editor.__zones.addZone).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          afterLineNumber: 0,
          heightInPx: 26,
        })
      );
    });

    it("should remove previous zones when createWidgets is called again", () => {
      const editor = createEditorMock();

      service.createWidgets(editor, [createBlock("a", 5)], jest.fn());
      service.createWidgets(editor, [createBlock("b", 8)], jest.fn());

      expect(editor.__zones.removeZone).toHaveBeenCalledWith("zone-1");
      expect(editor.__zones.addZone).toHaveBeenCalledTimes(2);
    });
  });

  describe("widget behavior", () => {
    it("should return the same dom node instance when getDomNode is called twice", () => {
      const editor = createEditorMock();
      service.createWidgets(editor, [createBlock("same-node", 7)], jest.fn());
      const widget = editor.addContentWidget.mock.calls[0][0];

      const firstNode = widget.getDomNode();
      const secondNode = widget.getDomNode();

      expect(firstNode).toBe(secondNode);
    });

    it("should use block start line and above preference when getPosition is called", () => {
      const editor = createEditorMock();
      service.createWidgets(editor, [createBlock("pos", 14)], jest.fn());
      const widget = editor.addContentWidget.mock.calls[0][0];

      expect(widget.getPosition()).toEqual({
        position: { lineNumber: 14, column: 1 },
        // ContentWidgetPosition.ABOVE from @mxflow/ui/monaco-editor.
        preference: [1],
      });
    });

    it("should call onResolve with the correct resolution when action buttons are clicked", () => {
      const editor = createEditorMock();
      const block = createBlock("actions", 21);
      const onResolve = jest.fn<void, [ConflictBlock, ConflictResolution]>();
      service.createWidgets(editor, [block], onResolve);
      const widget = editor.addContentWidget.mock.calls[0][0];
      const node = widget.getDomNode();
      const buttons = Array.from(node.querySelectorAll("button"));

      buttons[0].click();
      buttons[1].click();
      buttons[2].click();

      expect(buttons).toHaveLength(3);
      expect(onResolve).toHaveBeenNthCalledWith(1, block, "current");
      expect(onResolve).toHaveBeenNthCalledWith(2, block, "incoming");
      expect(onResolve).toHaveBeenNthCalledWith(3, block, "both");
    });

    it("should render container with correct class and separator spans between buttons when widget DOM is created", () => {
      const editor = createEditorMock();
      service.createWidgets(editor, [createBlock("dom")], jest.fn());
      const widget = editor.addContentWidget.mock.calls[0][0];

      const node = widget.getDomNode();
      const separators = node.querySelectorAll(".conflict-widget__separator");
      const buttons = node.querySelectorAll("button");

      expect(node.className).toBe("conflict-widget");
      expect(separators).toHaveLength(2);
      expect(buttons).toHaveLength(3);
      expect(buttons[0].className).toContain(
        "conflict-widget__action--current"
      );
      expect(buttons[1].className).toContain(
        "conflict-widget__action--incoming"
      );
      expect(buttons[2].className).toContain("conflict-widget__action--both");
    });
  });
});
