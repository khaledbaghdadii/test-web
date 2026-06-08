import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from "@angular/core";
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { LazyLoadEvent } from "primeng/api";

import { ArtifactManagerService } from "../artifact-manager.service";
import {
  FactoryProduct,
  FactoryProducts,
} from "../api-models/factory-product/factory-product";
import { Select } from "primeng/select";

@Component({
  selector: "mxevolve-configuration-component-selector",
  templateUrl: "./configuration-component-selector.component.html",
  standalone: false,
})
export class ConfigurationComponentSelectorComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() projectId: string;
  @Input() required: boolean;
  @Input() mxVersion: string;
  @Input() mxBuildId: string;
  @Input() bipVersion?: string;
  @Input() bipBuildId?: string;
  @Input() parentFactoryProductId?: string;

  @Output() bipVersionChange = new EventEmitter<string | undefined>();
  @Output() bipBuildIdChange = new EventEmitter<string | undefined>();
  @Output() factoryProductIdChange = new EventEmitter<string | undefined>();

  bipVersionDropdown = signal<{ label: string; value: string }[]>([]);
  bipBuildIdDropdown: { label: string; value: string }[] = [];

  selectedBipVersion: string | undefined;
  selectedBipBuildId: string | undefined;

  factoryProducts: FactoryProduct[] = [];
  factoryProduct: FactoryProduct | undefined;

  readonly debounceTime = 100;
  readonly dropdownMaxNbOfDisplayedItems = 5;
  readonly itemHeight = 40;
  readonly itemStep = 5;

  readonly dropdownHeight = computed(() => {
    if (this.bipVersionDropdown().length < this.dropdownMaxNbOfDisplayedItems) {
      return `${this.bipVersionDropdown().length * this.itemHeight}px`;
    } else {
      return `${this.dropdownMaxNbOfDisplayedItems * this.itemHeight}px`;
    }
  });

  lastBipVersionPage? = false;
  isSearchingForBipVersions = false;
  bipVersionPageIndex = 0;
  bipVersionSearchKey: string;
  bipVersionSearchSubject = new Subject<string>();
  bipVersionPageIndexSubject = new Subject<number>();
  private readonly componentDestroy$ = new Subject();

  private initialBipVersionLoadComplete = signal(false);
  showDropdown = signal(false);
  private readonly ngZone = inject(NgZone);
  private readonly artifactManagerService = inject(ArtifactManagerService);

  ngOnInit() {
    this.populateDropdownOnSearchChangeAndScroll();

    if (this.bipVersion) {
      this.selectedBipVersion = this.bipVersion;
      const currentBipVersion = this.bipVersion;
      if (!this.bipVersionExistsInDropdown(this.selectedBipVersion)) {
        this.bipVersionDropdown.update((arr) => [
          ...arr,
          {
            label: currentBipVersion,
            value: currentBipVersion,
          },
        ]);
      }
      this.bipVersionSearchSubject.next(this.selectedBipVersion);
      this.bipVersionPageIndexSubject.next(0);

      if (this.bipBuildId) {
        this.selectedBipBuildId = this.bipBuildId;
        this.bipBuildIdDropdown.push({
          label: this.selectedBipBuildId,
          value: this.selectedBipBuildId,
        });
      }
    } else {
      this.bipVersionSearchSubject.next("");
      this.bipVersionPageIndexSubject.next(0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["mxBuildId"] || changes["parentFactoryProductId"]) {
      this.bipVersionPageIndex = 0;
      this.bipVersionPageIndexSubject.next(0);
      this.bipVersionSearchSubject.next("");
      this.bipVersion = undefined;
      this.bipBuildId = undefined;
      this.selectedBipVersion = undefined;
      this.selectedBipBuildId = undefined;
      this.bipBuildIdDropdown = [];
      this.bipVersionDropdown.set([]);
    }
    if (changes["bipVersion"]) {
      this.handleBipVersionChange(changes);
    }
  }

  ngOnDestroy() {
    this.componentDestroy$.next({});
    this.bipVersionSearchSubject.complete();
    this.componentDestroy$.complete();
  }

  handleBipVersionScroll = (event: LazyLoadEvent): void => {
    if (this.shouldScrollFactoryProductsForBipVersion(event.last ?? 0)) {
      this.bipVersionPageIndexSubject.next(this.bipVersionPageIndex);
    }
  };

  onSelectedBipVersion(bipVersion: string) {
    if (bipVersion == this.bipVersion) {
      return;
    }
    this.bipVersionChange.emit(bipVersion ?? undefined);
    this.bipBuildIdChange.emit(undefined);
    this.factoryProductIdChange.emit(undefined);
    this.selectedBipBuildId = undefined;
    this.popUpBipBuildIdDropdown(bipVersion);
  }

  clearBipVersionSearchKey(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    this.bipVersionSearchKey = "";
    this.bipVersionSearchSubject.next("");
  }

  onBipVersionSearchKeyChange(event: string) {
    this.bipVersionPageIndexSubject.next(0);
    this.bipVersionSearchSubject.next(event);
  }

  onSelectedBipBuildId(bipBuildId: string) {
    if (bipBuildId == this.bipBuildId) {
      return;
    }
    this.bipBuildIdChange.emit(bipBuildId);
    this.factoryProduct = this.getFactoryProduct(bipBuildId);
    this.factoryProductIdChange.emit(this.factoryProduct?.id);
  }

  private getFactoryProduct(bipBuildId: string) {
    return this.factoryProducts
      .filter((fp) => fp.parent?.id === this.parentFactoryProductId)
      .filter((fp) =>
        fp.configurationComponents.some(
          (config) => config.version === this.selectedBipVersion
        )
      )
      .filter((fp) =>
        fp.softwareProduct.builds.some(
          (build) => build.mxBuild.buildId === this.mxBuildId
        )
      )
      .find((fp) =>
        fp.configurationComponents.some((config) =>
          config.builds.some((build) => build.mxBuild.buildId === bipBuildId)
        )
      );
  }

  private shouldScrollFactoryProductsForBipVersion(last: number): boolean {
    return (
      !this.lastBipVersionPage &&
      this.bipVersionDropdown().length < last + this.itemStep &&
      !this.isSearchingForBipVersions
    );
  }

  private populateDropdownOnSearchChangeAndScroll() {
    const searchObservable = this.bipVersionSearchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged((prev, curr) => prev === curr),
      tap(() => this.setupSearchForBipVersion())
    );
    const scrollObservable = this.bipVersionPageIndexSubject.pipe();
    combineLatest([searchObservable, scrollObservable])
      .pipe(
        switchMap(([searchKey, pageIndex]) =>
          this.getFactoryProducts(searchKey, this.projectId, pageIndex)
        ),
        takeUntil(this.componentDestroy$)
      )
      .subscribe({
        next: (fp) => {
          this.loadNewFactoryProducts(fp);

          // Mark initial load as complete after first response (no search key)
          if (
            !this.initialBipVersionLoadComplete() &&
            !this.bipVersionSearchKey
          ) {
            this.initialBipVersionLoadComplete.set(true);
            // Only show dropdown if there are results
            if (this.bipVersionDropdown().length > 0) {
              this.showDropdown.set(true);
            } else {
              this.showDropdown.set(false);
            }
          }

          if (this.selectedBipVersion) {
            this.popUpBipBuildIdDropdown(this.selectedBipVersion);
          }
        },
      });
  }

  private popUpBipBuildIdDropdown(bipVersion: string) {
    this.bipBuildIdDropdown =
      this.getConfigurationComponents(bipVersion)?.flatMap((config) =>
        config.builds
          .filter((build) => !build.purged)
          .map((build) => ({
            label: build.mxBuild.buildId,
            value: build.mxBuild.buildId,
          }))
      ) ?? [];

    if (this.bipBuildIdDropdown.length === 1) {
      this.selectedBipBuildId = this.bipBuildIdDropdown[0].value;
      this.bipBuildIdChange.emit(this.selectedBipBuildId);
      this.factoryProduct = this.getFactoryProduct(this.selectedBipBuildId);
      this.factoryProductIdChange.emit(this.factoryProduct?.id);
    }
  }

  private getConfigurationComponents(bipVersion: string) {
    return this.factoryProducts.find(
      (fp) =>
        fp.softwareProduct.version === this.mxVersion &&
        fp.configurationComponents.some(
          (config) => config.version === bipVersion
        )
    )?.configurationComponents;
  }

  private loadNewFactoryProducts(newFactoryProducts: FactoryProducts): void {
    if (!newFactoryProducts || !newFactoryProducts?.content?.length) {
      return;
    }
    this.lastBipVersionPage = newFactoryProducts.last;
    const uniqueAdditionalBipVersions =
      this.getUniqueAdditionalBipVersions(newFactoryProducts);
    this.bipVersionPageIndex++;

    if (uniqueAdditionalBipVersions.length == 0 && !this.lastBipVersionPage) {
      this.bipVersionPageIndexSubject.next(this.bipVersionPageIndex);
    } else {
      this.bipVersionDropdown.update((arr) =>
        arr.concat(uniqueAdditionalBipVersions)
      );

      if (this.bipVersionDropdown().length === 1 && this.lastBipVersionPage) {
        this.selectedBipVersion = this.bipVersionDropdown()[0].value;
        this.bipVersionChange.emit(this.selectedBipVersion);
        this.popUpBipBuildIdDropdown(this.selectedBipVersion);
      }
    }

    if (this.bipVersionDropdown().length == 0 && this.lastBipVersionPage) {
      this.factoryProduct = newFactoryProducts.content[0];
      this.factoryProductIdChange.emit(this.factoryProduct.id);
      return;
    }

    this.factoryProducts = this.factoryProducts.concat(
      ...newFactoryProducts.content
    );
  }

  private getUniqueAdditionalBipVersions(newFactoryProducts: FactoryProducts) {
    const seen = new Set<string>(
      this.bipVersionDropdown().map((item) => item.value)
    );
    return newFactoryProducts.content
      .flatMap(
        (factoryProduct) =>
          factoryProduct.configurationComponents
            ?.filter((config) => !config.purged)
            ?.map((config) => ({
              label: config.version,
              value: config.version,
            })) ?? []
      )
      .filter((version) => {
        if (seen.has(version.value)) {
          return false;
        }
        seen.add(version.value);
        return true;
      });
  }

  private getFactoryProducts(
    searchKey: string,
    projectId: string,
    pageIndex: number
  ): Observable<FactoryProducts> {
    return this.artifactManagerService
      .getFactoryProducts(
        {
          parentFactoryProductIdFilter: this.parentFactoryProductId,
          softwareProductVersionFilter: this.mxVersion,
          softwareProductBuildFilter: this.mxBuildId,
          configurationComponentVersionSearch: searchKey,
          pageSize: 10,
          pageIndex: pageIndex,
        },
        projectId
      )
      .pipe(tap(() => (this.isSearchingForBipVersions = false)));
  }

  private resetBipIndexingValues(): void {
    this.bipVersionPageIndex = 0;
    this.lastBipVersionPage = false;
    this.bipVersionDropdown.set([]);
  }

  private setupSearchForBipVersion() {
    this.isSearchingForBipVersions = true;
    this.factoryProducts = [];
    this.resetBipIndexingValues();
  }

  private bipVersionExistsInDropdown(bipVersion: string): boolean {
    return this.bipVersionDropdown().some((item) => item.value === bipVersion);
  }

  private handleBipVersionChange(changes: SimpleChanges) {
    const newBipVersion = changes["bipVersion"].currentValue;

    if (newBipVersion && this.selectedBipVersion != newBipVersion) {
      this.selectedBipVersion = newBipVersion;
      if (!this.bipVersionExistsInDropdown(newBipVersion)) {
        this.bipVersionDropdown.update((arr) => [
          ...arr,
          {
            label: newBipVersion,
            value: newBipVersion,
          },
        ]);
      }
      this.bipVersionSearchSubject.next(newBipVersion);
      this.bipVersionPageIndexSubject.next(0);

      if (changes["bipBuildId"]) {
        const newBuildId = changes["bipBuildId"].currentValue;
        if (newBuildId && this.selectedBipBuildId != newBuildId) {
          this.selectedBipBuildId = newBuildId;
          this.bipBuildIdDropdown.push({
            label: newBuildId,
            value: newBuildId,
          });
        }
      }
    }
  }

  onPanelShow(selector: Select): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          const scroller = selector.scroller;
          if (scroller) {
            if (!scroller.initialized) {
              scroller.viewInit();
            } else {
              scroller.init();
            }
          }
        });
      });
    });
  }
}
