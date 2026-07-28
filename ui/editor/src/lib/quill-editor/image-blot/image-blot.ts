import * as Parchment from 'parchment';
import Quill from 'quill/core';

const InlineBlot = Quill.import('blots/embed') as typeof Parchment.InlineBlot;

export class ImageBlot extends InlineBlot {
  static override create(data: { src: string; attachmentId: string }) {
    const node = super.create(data);
    if (data.src) {
      node.setAttribute('src', data.src);
    }
    if (data.attachmentId) {
      node.setAttribute('data-attachment-id', data.attachmentId);
    }
    return node;
  }

  static value(domNode: HTMLElement) {
    const src = domNode.getAttribute('src');
    const attachmentId = domNode.getAttribute('data-attachment-id');
    const value: { [key: string]: string } = {};
    if (src) {
      value['src'] = src;
    }

    if (attachmentId) {
      value['attachmentId'] = attachmentId;
    }
    return value;
  }
}

ImageBlot.blotName = 'imageBlot';
ImageBlot.tagName = 'img';

Quill.register(ImageBlot, true);
