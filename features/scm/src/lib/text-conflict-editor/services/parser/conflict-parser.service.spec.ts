import { ConflictParserService } from "./conflict-parser.service";
import type {
  ConflictBlock,
  ConflictResolution,
} from "../../models/conflict.models";

describe("ConflictParserService", () => {
  let service: ConflictParserService;

  beforeEach(() => {
    service = new ConflictParserService();
  });

  describe("parse", () => {
    it("should return an empty list when text has no conflict markers", () => {
      const result = service.parse("plain text");

      expect(result).toEqual([]);
    });

    it("should return parsed current and incoming sections when one conflict block is present", () => {
      const text = [
        "before",
        "<<<<<<< HEAD",
        "ours",
        "=======",
        "theirs",
        ">>>>>>> branch",
        "after",
      ].join("\n");

      const result = service.parse(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        current: "ours",
        incoming: "theirs",
      });
      expect(result[0].startOffset).toBe(text.indexOf("<<<<<<< HEAD"));
      expect(result[0].endOffset).toBe(
        result[0].startOffset + result[0].raw.length
      );
    });

    it("should match a conflict block with empty incoming side", () => {
      const text = [
        "before",
        "<<<<<<< HEAD",
        "##",
        "=======",
        ">>>>>>> e6d4d39f (testtt)",
        "after",
      ].join("\n");

      const result = service.parse(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        current: "##",
        incoming: "",
      });
    });

    it("should match a conflict block with empty current side", () => {
      const text = [
        "before",
        "<<<<<<< HEAD",
        "=======",
        "theirs",
        ">>>>>>> branch",
        "after",
      ].join("\n");

      const result = service.parse(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        current: "",
        incoming: "theirs",
      });
    });

    it("should return all blocks in order when multiple conflict blocks are present", () => {
      const text = [
        "<<<<<<< A",
        "a1",
        "=======",
        "b1",
        ">>>>>>> B",
        "middle",
        "<<<<<<< C",
        "a2",
        "=======",
        "b2",
        ">>>>>>> D",
      ].join("\n");

      const result = service.parse(text);

      expect(result).toHaveLength(2);
      expect(result[0].current).toBe("a1");
      expect(result[0].incoming).toBe("b1");
      expect(result[1].current).toBe("a2");
      expect(result[1].incoming).toBe("b2");
    });
  });

  describe("getConflictMarkers", () => {
    it("should exclude the final newline line from end marker when block has trailing newline", () => {
      const block = {
        id: "1",
        start: 10,
        end: 16,
        startOffset: 0,
        endOffset: 0,
        current: "ours",
        incoming: "theirs",
        raw: [
          "<<<<<<< HEAD",
          "ours",
          "=======",
          "theirs",
          ">>>>>>> branch",
          "",
        ].join("\n"),
      } satisfies ConflictBlock;

      const result = service.getConflictMarkers(block);

      expect(result).toEqual({
        start: 10,
        separator: 12,
        end: 15,
      });
    });

    it("should keep original end when block has no trailing newline", () => {
      const block = {
        id: "2",
        start: 3,
        end: 9,
        startOffset: 0,
        endOffset: 0,
        current: "ours",
        incoming: "theirs",
        raw: [
          "<<<<<<< HEAD",
          "ours",
          "=======",
          "theirs",
          ">>>>>>> branch",
        ].join("\n"),
      } satisfies ConflictBlock;

      const result = service.getConflictMarkers(block);

      expect(result).toEqual({
        start: 3,
        separator: 5,
        end: 9,
      });
    });

    it("should fall back separator to block start when block is missing its separator", () => {
      const block = {
        id: "3",
        start: 20,
        end: 22,
        startOffset: 0,
        endOffset: 0,
        current: "ours",
        incoming: "theirs",
        raw: ["<<<<<<< HEAD", "ours", ">>>>>>> branch"].join("\n"),
      } satisfies ConflictBlock;

      const result = service.getConflictMarkers(block);

      expect(result.separator).toBe(20);
    });
  });

  describe("getReplacementText", () => {
    const block = {
      id: "replacement",
      start: 1,
      end: 5,
      startOffset: 0,
      endOffset: 0,
      current: "current-text",
      incoming: "incoming-text",
      raw: "raw-text",
    } satisfies ConflictBlock;

    it("should return current text when resolution is current", () => {
      const result = service.getReplacementText(block, "current");

      expect(result).toBe("current-text");
    });

    it("should return incoming text when resolution is incoming", () => {
      const result = service.getReplacementText(block, "incoming");

      expect(result).toBe("incoming-text");
    });

    it("should return concatenated text with newline when resolution is both", () => {
      const result = service.getReplacementText(block, "both");

      expect(result).toBe("current-text\nincoming-text");
    });

    it("should return raw text when resolution is unknown", () => {
      const result = service.getReplacementText(
        block,
        "unknown" as ConflictResolution
      );

      expect(result).toBe("raw-text");
    });

    describe("trailing newline preservation", () => {
      const blockWithTrailingNewline = {
        ...block,
        raw: "<<<<<<< HEAD\ncurrent-text\n=======\nincoming-text\n>>>>>>> branch\n",
      } satisfies ConflictBlock;

      it("should append trailing newline to current text when raw ends with newline", () => {
        const result = service.getReplacementText(
          blockWithTrailingNewline,
          "current"
        );

        expect(result).toBe("current-text\n");
      });

      it("should append trailing newline to incoming text when raw ends with newline", () => {
        const result = service.getReplacementText(
          blockWithTrailingNewline,
          "incoming"
        );

        expect(result).toBe("incoming-text\n");
      });

      it("should append trailing newline to both text when raw ends with newline", () => {
        const result = service.getReplacementText(
          blockWithTrailingNewline,
          "both"
        );

        expect(result).toBe("current-text\nincoming-text\n");
      });
    });
  });
});
