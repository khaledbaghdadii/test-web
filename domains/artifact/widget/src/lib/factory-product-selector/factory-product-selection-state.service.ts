import {
  DestroyRef,
  inject,
  Injectable,
  signal,
  computed,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY } from "rxjs";
import { catchError } from "rxjs/operators";
import {
  FactoryProduct,
  FactoryProductApiService,
  SoftwareProductVersion,
  SoftwareProductBuild,
  BipVersion,
  ConfigurationComponentResponse,
  ConfigurationComponentBuildResponse,
} from "@mxevolve/domains/artifact/data-access";
import { DropdownOption } from "@mxflow/ui/mxevolve-dropdown";

export interface BipBuildOption {
  readonly buildId: string;
  readonly factoryProductId: string;
}

@Injectable()
export class FactoryProductSelectionStateService {
  private readonly factoryProductApiService = inject(FactoryProductApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = signal<string | undefined>(undefined);
  readonly mxVersion = signal<SoftwareProductVersion | null>(null);
  readonly mxBuildId = signal<SoftwareProductBuild | null>(null);
  readonly bipVersion = signal<BipVersion | null>(null);
  readonly bipBuildId = signal<BipBuildOption | null>(null);
  readonly factoryProductId = signal<string | undefined>(undefined);
  readonly accumulatedFactoryProducts = signal<FactoryProduct[]>([]);

  readonly isCustomBuild = computed(() => !!this.mxBuildId()?.projectId);

  readonly mxBuildIdDisabled = computed(() => !this.mxVersion());

  readonly bipVersionDisabled = computed(
    () =>
      !this.mxVersion() ||
      !this.mxBuildId() ||
      this.accumulatedFactoryProducts().length === 0 ||
      !this.hasBipVersions()
  );

  readonly bipBuildIdDisabled = computed(
    () =>
      !this.bipVersion() ||
      (this.accumulatedFactoryProducts().length > 0 &&
        this.bipBuildOptions().length === 0)
  );

  readonly hasBipVersions = computed(() => {
    const factoryProducts = this.accumulatedFactoryProducts();
    return factoryProducts.some(
      (fp) =>
        fp.configurationComponents?.some(
          (cc: ConfigurationComponentResponse) => !cc.purged
        ) ?? false
    );
  });

  readonly bipBuildOptions = computed<DropdownOption<BipBuildOption>[]>(() => {
    const selectedBipVersion = this.bipVersion();
    if (!selectedBipVersion) {
      return [];
    }
    const factoryProducts = this.accumulatedFactoryProducts();
    const options: DropdownOption<BipBuildOption>[] = [];
    const seen = new Set<string>();

    for (const factoryProduct of factoryProducts) {
      for (const configComponent of factoryProduct.configurationComponents ??
        []) {
        if (
          configComponent.purged ||
          configComponent.version !== selectedBipVersion.version
        ) {
          continue;
        }
        for (const build of configComponent.builds ?? []) {
          if (build.purged || seen.has(build.mxBuild.buildId)) {
            continue;
          }
          seen.add(build.mxBuild.buildId);
          options.push({
            label: build.mxBuild.buildId,
            value: {
              buildId: build.mxBuild.buildId,
              factoryProductId: factoryProduct.id,
            },
          });
        }
      }
    }
    return options;
  });

  selectMxVersion(version: SoftwareProductVersion | null): void {
    this.mxVersion.set(version);
    this.mxBuildId.set(null);
    this.bipVersion.set(null);
    this.bipBuildId.set(null);
    this.factoryProductId.set(undefined);
    this.accumulatedFactoryProducts.set([]);
  }

  selectMxBuildId(build: SoftwareProductBuild | null): void {
    this.mxBuildId.set(build);
    this.bipVersion.set(null);
    this.bipBuildId.set(null);
    this.factoryProductId.set(undefined);
    this.accumulatedFactoryProducts.set([]);
  }

  applyMxBuildAutoSelection(
    availableBuilds: readonly SoftwareProductBuild[],
    isLastPage: boolean,
    isSearching: boolean
  ): void {
    if (
      !this.mxVersion() ||
      this.mxBuildId() ||
      isSearching ||
      !isLastPage ||
      availableBuilds.length !== 1
    ) {
      return;
    }

    this.selectMxBuildId(availableBuilds[0]);
  }

  selectBipVersion(version: BipVersion | null): void {
    this.bipVersion.set(version);
    this.bipBuildId.set(null);
    this.factoryProductId.set(undefined);

    if (version) {
      const options = this.bipBuildOptions();
      if (options.length === 1) {
        this.selectBipBuildId(options[0].value);
      }
    }
  }

  selectBipBuildId(option: BipBuildOption | null): void {
    this.bipBuildId.set(option);
    this.factoryProductId.set(option?.factoryProductId);
  }

  accumulateFactoryProducts(
    factoryProducts: FactoryProduct[],
    isLastPage: boolean
  ): void {
    this.accumulatedFactoryProducts.update((existing) => [
      ...existing,
      ...factoryProducts,
    ]);

    const allFactoryProducts = this.accumulatedFactoryProducts();

    const hasNonPurgedBipVersions = allFactoryProducts.some(
      (fp) =>
        fp.configurationComponents?.some(
          (cc: ConfigurationComponentResponse) => !cc.purged
        ) ?? false
    );

    if (!hasNonPurgedBipVersions && allFactoryProducts.length > 0) {
      this.factoryProductId.set(allFactoryProducts[0].id);
      return;
    }

    if (isLastPage) {
      const seen = new Set<string>();
      const uniqueVersions: string[] = [];
      for (const fp of allFactoryProducts) {
        for (const cc of fp.configurationComponents ?? []) {
          if (!cc.purged && !seen.has(cc.version)) {
            seen.add(cc.version);
            uniqueVersions.push(cc.version);
          }
        }
      }
      if (uniqueVersions.length === 1) {
        this.selectBipVersion({ version: uniqueVersions[0] });
      }
    }
  }

  /**
   * A product that no longer resolves leaves the selection exactly as it was:
   * whatever was prefilled stays, and nothing is written back to the form.
   */
  initializeFromFactoryProductId(
    factoryProductId: string,
    projectId: string
  ): void {
    this.factoryProductApiService
      .getFactoryProductById(projectId, factoryProductId)
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((factoryProduct) => {
        this.prefillFromFactoryProduct(factoryProduct);
      });
  }

  prefill(
    mxVersion: SoftwareProductVersion | null,
    mxBuild: SoftwareProductBuild | null,
    bipVersion: BipVersion | null,
    bipBuild: BipBuildOption | null
  ): void {
    if (mxVersion) {
      this.mxVersion.set(mxVersion);
    }
    if (mxBuild) {
      this.mxBuildId.set(mxBuild);
    }
    if (bipVersion) {
      this.bipVersion.set(bipVersion);
    }
    if (bipBuild) {
      this.bipBuildId.set(bipBuild);
      this.factoryProductId.set(bipBuild.factoryProductId);
    }
  }

  /**
   * Values already prefilled win: a repush carries the exact build the previous
   * run used, and re-deriving it from the product would silently land on the
   * first one instead.
   */
  private prefillFromFactoryProduct(factoryProduct: FactoryProduct): void {
    const softwareProduct = factoryProduct.softwareProduct;
    if (!softwareProduct) {
      return;
    }

    if (!this.mxVersion()) {
      this.mxVersion.set({ version: softwareProduct.version });
    }

    // Legacy picked the first build that actually carries bundles, not simply
    // the first one: a build with no `mxBundles` has nothing to convert, so
    // hydrating the form with it produced a product the run could not use.
    const build = softwareProduct.builds?.find(
      (candidate) => (candidate.mxBundles?.length ?? 0) > 0
    );
    if (build && !this.mxBuildId()) {
      this.mxBuildId.set({
        buildId: build.mxBuild.buildId,
        projectId: build.projectId,
      });
    }

    this.accumulatedFactoryProducts.set([factoryProduct]);

    const nonPurgedConfigComponents = (
      factoryProduct.configurationComponents ?? []
    ).filter((cc: ConfigurationComponentResponse) => !cc.purged);

    if (nonPurgedConfigComponents.length > 0) {
      const firstConfigComponent = nonPurgedConfigComponents[0];
      if (!this.bipVersion()) {
        this.bipVersion.set({ version: firstConfigComponent.version });
      }

      // Same rule as the MX build above (legacy applied it to both).
      const bipBuild = (firstConfigComponent.builds ?? [])
        .filter((b: ConfigurationComponentBuildResponse) => !b.purged)
        .find(
          (b: ConfigurationComponentBuildResponse) =>
            (b.mxBundles?.length ?? 0) > 0
        );
      if (bipBuild && !this.bipBuildId()) {
        this.bipBuildId.set({
          buildId: bipBuild.mxBuild.buildId,
          factoryProductId: factoryProduct.id,
        });
      }
    }

    this.factoryProductId.set(factoryProduct.id);
  }
}
