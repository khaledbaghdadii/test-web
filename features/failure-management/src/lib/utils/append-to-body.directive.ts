import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
} from "@angular/core";

@Directive({
  selector: "[mxevolveAppendToBody]",
  standalone: true,
})
export class AppendToBodyDirective implements OnInit, OnDestroy {
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly element: HTMLElement;

  constructor() {
    this.element = this.elRef.nativeElement;
  }

  ngOnInit() {
    document.body.appendChild(this.element);
  }

  ngOnDestroy() {
    if (document.body.contains(this.element)) {
      document.body.removeChild(this.element);
    }
  }
}
