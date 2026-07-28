import * as Parchment from "parchment";
import Quill from "quill/core";

const InlineBlot = Quill.import("blots/inline") as typeof Parchment.InlineBlot;

export class LinkBlot extends InlineBlot {
  static override create(data: { href: string; attachmentId: string }) {
    const node = super.create(data);
    if (data.href) {
      node.setAttribute("href", data.href);
    }
    if (data.attachmentId) {
      node.setAttribute("data-attachment-id", data.attachmentId);
    }
    return node;
  }

  static override formats(domNode: HTMLElement) {
    const href = domNode.getAttribute("href");
    const attachmentId = domNode.getAttribute("data-attachment-id");
    const value: { [key: string]: string } = {};
    if (href) {
      value["href"] = href;
    }
    if (attachmentId) {
      value["attachmentId"] = attachmentId;
    }
    return value;
  }
}

LinkBlot.blotName = "linkBlot";
LinkBlot.tagName = "a";

Quill.register(LinkBlot, true);
