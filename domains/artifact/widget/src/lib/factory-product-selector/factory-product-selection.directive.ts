import {
  Directive,
  effect,
  inject,
  input,
  OnInit,
  output,
} from "@angular/core";
import {
  SoftwareProductVersion,
  SoftwareProductBuild,
  BipVersion,
} from "@mxevolve/domains/artifact/data-access";
import {
  BipBuildOption,
  FactoryProductSelectionStateService,
} from "./factory-product-selection-state.service";

@Directive({
  selector: "[mxevolveFactoryProductSelection]",
  standalone: true,
  providers: [FactoryProductSelectionStateService],
})
export class FactoryProductSelectionDirective implements OnInit {
  readonly projectId = input.required<string>();
  readonly factoryProductId = input<string | undefined>(undefined);
  readonly initialMxVersion = input<SoftwareProductVersion | null>(null);
  readonly initialMxBuildId = input<SoftwareProductBuild | null>(null);
  readonly initialBipVersion = input<BipVersion | null>(null);
  readonly initialBipBuildId = input<BipBuildOption | null>(null);

  readonly mxVersionChange = output<SoftwareProductVersion | null>();
  readonly mxBuildIdChange = output<SoftwareProductBuild | null>();
  readonly bipVersionChange = output<BipVersion | null>();
  readonly bipBuildIdChange = output<BipBuildOption | null>();
  readonly factoryProductIdChange = output<string | undefined>();

  private readonly state = inject(FactoryProductSelectionStateService);

  constructor() {
    this.emitOnChange(this.state.mxVersion, this.mxVersionChange);
    this.emitOnChange(this.state.mxBuildId, this.mxBuildIdChange);
    this.emitOnChange(this.state.bipVersion, this.bipVersionChange);
    this.emitOnChange(this.state.bipBuildId, this.bipBuildIdChange);
    this.emitOnChange(this.state.factoryProductId, this.factoryProductIdChange);
  }

  /**
   * Emits state changes, but stays silent while the selection is still empty.
   *
   * An `effect` fires once on creation, so all five of these used to emit the
   * empty starting state before the user had touched anything. Consumers treat
   * an emission as a selection: the upgrade executor patched the factory-product
   * control and called `markAsDirty()`, which made the form show "all attributes
   * are required" the moment the dialog opened, and replaced the payload's
   * unset sub-keys with `""`.
   *
   * The gate is on emptiness rather than on "the first effect run", so a prefill
   * still reaches the consumer no matter when it resolves. Once something real
   * has been emitted, clearing a dropdown emits `null` as it should.
   */
  private emitOnChange<T>(
    source: () => T,
    target: { emit: (value: T) => void }
  ): void {
    let emitted = false;
    effect(() => {
      const value = source();
      if (!emitted && (value === null || value === undefined)) {
        return;
      }
      emitted = true;
      target.emit(value);
    });
  }

  /**
   * The explicit MX/BIP values are applied first, so a caller that knows exactly
   * which build was used keeps it; the by-id lookup then fills in whatever they
   * left out and loads the product the dropdowns list their options from.
   */
  ngOnInit(): void {
    this.state.projectId.set(this.projectId());

    const mxVersion = this.initialMxVersion();
    const mxBuild = this.initialMxBuildId();
    const bipVersion = this.initialBipVersion();
    const bipBuild = this.initialBipBuildId();

    if (mxVersion || mxBuild || bipVersion || bipBuild) {
      this.state.prefill(mxVersion, mxBuild, bipVersion, bipBuild);
    }

    const factoryProductId = this.factoryProductId();
    if (factoryProductId) {
      this.state.initializeFromFactoryProductId(
        factoryProductId,
        this.projectId()
      );
    }
  }
}
