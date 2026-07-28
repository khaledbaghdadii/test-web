import {
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from "@angular/core";

@Component({
  selector: "mxevolve-show-more-less",
  templateUrl: "./mxevolve-show-more-less.component.html",
  styleUrls: ["./mxevolve-show-more-less.component.css"],
  standalone: false,
})
export class MXEvolveShowMoreLessComponent {
  listOfItems = input<string[]>([]);
  defaultNbOfItemsToShow = input(3);
  isVertical = input(false);
  getItemRouterLink = input<(item: string) => string | unknown[]>();

  private readonly expanded = signal(false);
  private readonly listOfItemsKey = computed(() =>
    (this.listOfItems() ?? []).join(",")
  );

  nbOfItemsToShow = computed(() =>
    this.expanded()
      ? (this.listOfItems() ?? []).length
      : this.defaultNbOfItemsToShow()
  );
  text = computed(
    () =>
      "(" + ((this.listOfItems() ?? []).length - this.nbOfItemsToShow()) + ")"
  );

  constructor() {
    effect(() => {
      this.listOfItemsKey();
      untracked(() => this.expanded.set(false));
    });
  }

  showAllItems(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    this.expanded.set(true);
  }

  showLessItems(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    this.expanded.set(false);
  }
}
