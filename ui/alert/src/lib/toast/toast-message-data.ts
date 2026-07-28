export interface ToastMessageData {
  link?: ToastMessageDataLink;
}

interface ToastMessageDataLink {
  linkText: string;
  href: string;
}
