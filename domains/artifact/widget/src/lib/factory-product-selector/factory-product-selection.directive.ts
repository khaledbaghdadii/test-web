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
    effect(() => {
      this.mxVersionChange.emit(this.state.mxVersion());
    });

    effect(() => {
      this.mxBuildIdChange.emit(this.state.mxBuildId());
    });

    effect(() => {
      this.bipVersionChange.emit(this.state.bipVersion());
    });

    effect(() => {
      this.bipBuildIdChange.emit(this.state.bipBuildId());
    });

    effect(() => {
      this.factoryProductIdChange.emit(this.state.factoryProductId());
    });
  }

  ngOnInit(): void {
    this.state.projectId.set(this.projectId());

    const factoryProductId = this.factoryProductId();
    if (factoryProductId) {
      this.state.initializeFromFactoryProductId(
        factoryProductId,
        this.projectId()
      );
      return;
    }

    const mxVersion = this.initialMxVersion();
    const mxBuild = this.initialMxBuildId();
    const bipVersion = this.initialBipVersion();
    const bipBuild = this.initialBipBuildId();

    if (mxVersion || mxBuild || bipVersion || bipBuild) {
      this.state.prefill(mxVersion, mxBuild, bipVersion, bipBuild);
    }
  }
}
