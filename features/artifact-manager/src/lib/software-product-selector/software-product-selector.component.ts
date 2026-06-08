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
  Signal,
  SimpleChanges,
  WritableSignal,
} from "@angular/core";
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
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
import {
  MxBuildIdDropdownOption,
  MxBuildIdDropdownValue,
} from "./model/mxbuildid-dropdown-option";
import { Select } from "primeng/select";

@Component({
  selector: "mxevolve-software-product-selector",
  templateUrl: "./software-product-selector.component.html",
  standalone: false,
})
export class SoftwareProductSelectorComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() projectId: string;
  @Input() required: boolean;
  @Input() mxVersion: string | undefined;
  @Input() mxBuildId: string | undefined;
  @Input() parentFactoryProductId: string | undefined;

  @Output() mxVersionChange = new EventEmitter<string | undefined>();
  @Output() mxBuildIdChange = new EventEmitter<
    MxBuildIdDropdownValue | undefined
  >();
  @Output() errorOutput = new EventEmitter<string>();
  mxVersionDropdown: { label: string; value: string }[] = [];
  mxBuildIdDropdown: MxBuildIdDropdownOption[] = [];

  mxVersionDropdownSignal = signal<{ label: string; value: string }[]>([]);
  mxbuildIdDropdownSignal = signal<MxBuildIdDropdownOption[]>([]);
  selectedMxVersion: string | undefined;
  selectedMxBuildId: MxBuildIdDropdownValue | undefined;

  factoryProductsForMxVersion: FactoryProduct[] = [];
  factoryProductsForMxBuild: FactoryProduct[] = [];

  readonly debounceTime = 100;
  readonly itemHeight = 40;
  readonly itemsStep = 5;

  lastMxVersionPage?: boolean = false;
  mxVersionPageIndex = 0;
  isSearchingForMxVersion = false;
  mxVersionSearchKey: string;
  mxVersionSearchSubject = new Subject<string>();
  mxVersionPageIndexSubject = new Subject<number>();

  lastMxBuildPage?: boolean = false;
  mxBuildPageIndex = 0;
  isSearchingForMxBuild = false;
  mxBuildSearchKey: string;
  mxBuildSearchSubject = new Subject<string>();
  mxBuildPageIndexSubject = new Subject<number>();
  mxVersionChangeSubject = new Subject<string>();
  customString = "CUSTOM-";
  private readonly componentDestroy$ = new Subject();
  private readonly ngZone = inject(NgZone);
  private readonly artifactManagerService = inject(ArtifactManagerService);

  ngOnInit() {
    this.populateMxVersionDropdownOnSearchChangeAndScroll();
    this.populateMxBuildIdDropdownOnSearchChangeAndScroll();
    this.prefillData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["mxVersion"]) {
      this.handleMxVersionChange(changes["mxVersion"].currentValue, changes);
    }

    if (changes["mxBuildId"] || changes["parentFactoryProductId"]) {
      this.handleMxBuildIdChange(changes);
    }
  }

  mxVersionDropdownHeight = this.getDropdownHeight(
    this.mxVersionDropdownSignal
  );
  mxBuildIdDropdownHeight = this.getDropdownHeight(
    this.mxbuildIdDropdownSignal
  );

  private getDropdownHeight(
    signal: WritableSignal<
      MxBuildIdDropdownOption[] | { label: string; value: string }[]
    >
  ): Signal<string> {
    return computed(() => {
      if (signal().length === 0) {
        return `${this.itemHeight}px`;
      } else if (signal().length < 5) {
        return `${signal().length * this.itemHeight}px`;
      } else {
        return `${5 * this.itemHeight}px`;
      }
    });
  }

  private handleMxVersionChange(newMxVersion: string, changes: SimpleChanges) {
    if (newMxVersion && newMxVersion !== this.selectedMxVersion) {
      this.selectedMxVersion = newMxVersion;
      this.addMxVersionToDropdownIfNotExists(newMxVersion);
      this.mxVersionSearchSubject.next("");
      this.mxVersionPageIndexSubject.next(0);
      this.mxVersionChangeSubject.next(newMxVersion);
      this.handleMxBuildIdChange(changes);
    }
  }

  private handleMxBuildIdChange(changes: SimpleChanges) {
    const newBuildId = changes["mxBuildId"]
      ? changes["mxBuildId"].currentValue
      : this.selectedMxBuildId?.buildId;
    const newParentFactoryProductId = changes["parentFactoryProductId"]
      ? changes["parentFactoryProductId"].currentValue
      : this.selectedMxBuildId?.parentId;

    if (
      (newBuildId && newBuildId !== this.selectedMxBuildId?.buildId) ||
      (newParentFactoryProductId &&
        newParentFactoryProductId !== this.selectedMxBuildId?.parentId)
    ) {
      this.selectedMxBuildId = {
        buildId: newBuildId,
        parentId: newParentFactoryProductId,
      };
      this.addMxBuildToDropdownIfNotExists({
        buildId: newBuildId,
        parentId: newParentFactoryProductId,
      });
      this.mxBuildSearchSubject.next("");
      this.mxBuildPageIndexSubject.next(0);
    }
  }

  private prefillData() {
    if (this.mxVersion) {
      this.selectedMxVersion = this.mxVersion;
      this.mxVersionSearchSubject.next("");
      this.mxVersionPageIndexSubject.next(0);
      this.mxVersionChangeSubject.next(this.mxVersion);
      if (this.mxBuildId) {
        this.selectedMxBuildId = {
          buildId: this.mxBuildId,
          parentId: this.parentFactoryProductId,
        };
        this.mxBuildSearchSubject.next("");
        this.mxBuildPageIndexSubject.next(0);
      }
    }
  }

  private addMxVersionToDropdownIfNotExists(newMxVersion: string) {
    if (
      !this.mxVersionDropdown.some(
        (dropdownElement) => dropdownElement.value === newMxVersion
      )
    ) {
      this.mxVersionDropdown = this.mxVersionDropdown.concat([
        { label: newMxVersion, value: newMxVersion },
      ]);
      this.mxVersionDropdownSignal.set(this.mxVersionDropdown);
    }
  }

  private addMxBuildToDropdownIfNotExists(newBuildId: MxBuildIdDropdownValue) {
    if (
      !this.mxBuildIdDropdown.some(
        (dropdownElement) =>
          dropdownElement.value.buildId === newBuildId.buildId &&
          dropdownElement.value.parentId === newBuildId.parentId
      )
    ) {
      this.mxBuildIdDropdown = this.mxBuildIdDropdown.concat([
        {
          label: newBuildId.parentId
            ? `${this.customString}${newBuildId.buildId}`
            : newBuildId.buildId,
          value: {
            buildId: newBuildId.buildId,
            parentId: newBuildId.parentId,
          },
        },
      ]);
      this.mxbuildIdDropdownSignal.set(this.mxBuildIdDropdown);
    }
  }

  ngOnDestroy() {
    this.componentDestroy$.next({});
    this.mxVersionSearchSubject.complete();
    this.componentDestroy$.complete();
  }

  onSelectMxVersion(mxVersion: string) {
    if (mxVersion == this.mxVersion) {
      return;
    }
    this.mxVersionChange.emit(mxVersion ?? undefined);
    this.mxBuildIdChange.emit(undefined);
    this.selectedMxBuildId = undefined;
    this.prepareMxBuildDropdown();
  }

  clearMxVersionSearchKey(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    this.mxVersionSearchKey = "";
    this.mxVersionSearchSubject.next("");
  }

  onMxVersionSearchKeyChange(event: string) {
    this.mxVersionSearchSubject.next(event);
  }

  handleMxVersionScroll = (event: LazyLoadEvent): void => {
    if (this.shouldScrollFactoryProductsForMxVersion(event.last ?? 0)) {
      this.mxVersionPageIndexSubject.next(this.mxVersionPageIndex);
      this.mxVersionSearchSubject.next(this.mxVersionSearchKey);
    }
  };

  private populateMxVersionDropdownOnSearchChangeAndScroll() {
    const searchObservable = this.mxVersionSearchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged((prev, curr) => prev == curr),
      tap(() => this.setupSearchForMxVersion())
    );

    const scrollObservable = this.mxVersionPageIndexSubject.pipe(
      distinctUntilChanged((prev, curr) => prev === curr)
    );

    combineLatest([searchObservable, scrollObservable])
      .pipe(
        switchMap(([searchKey, pageIndex]) =>
          this.getFactoryProductForSelectMxVersion(
            searchKey,
            this.projectId,
            pageIndex
          )
        ),
        takeUntil(this.componentDestroy$)
      )
      .subscribe({
        next: (fp) => {
          this.loadNewFactoryProductsForMxVersion(fp);
        },
      });
  }

  private prepareMxBuildDropdown() {
    if (this.selectedMxVersion) {
      this.mxBuildIdDropdown = [];
      this.factoryProductsForMxBuild = [];
      this.mxBuildPageIndex = 0;
      this.lastMxBuildPage = false;
      this.mxBuildSearchKey = "";
      this.mxBuildSearchSubject.next("");
      this.mxVersionChangeSubject.next(this.selectedMxVersion);
      this.mxBuildPageIndexSubject.next(0);
    }
  }

  private shouldScrollFactoryProductsForMxVersion(last: number): boolean {
    return (
      !this.lastMxVersionPage &&
      this.mxVersionDropdown.length < last + this.itemsStep &&
      !this.isSearchingForMxVersion
    );
  }

  private setupSearchForMxVersion() {
    this.lastMxVersionPage = false;
    this.mxVersionPageIndex = 0;
    this.mxVersionPageIndexSubject.next(0);
    this.mxVersionDropdown = [];
    this.mxVersionDropdownSignal.set(this.mxVersionDropdown);
  }

  private getFactoryProductForSelectMxVersion(
    searchKey: string,
    projectId: string,
    pageIndex: number
  ): Observable<FactoryProducts> {
    this.isSearchingForMxVersion = true;
    return this.artifactManagerService
      .getFactoryProducts(
        {
          softwareProductVersionSearch: searchKey,
          pageSize: 20,
          pageIndex: pageIndex,
        },
        projectId
      )
      .pipe(
        catchError(() => {
          this.isSearchingForMxVersion = false;
          this.errorOutput.emit("Failed to fetch MX versions");
          return of();
        }),
        tap(() => {
          this.isSearchingForMxVersion = false;
        })
      );
  }

  private loadNewFactoryProductsForMxVersion(
    newFactoryProducts: FactoryProducts
  ): void {
    if (!newFactoryProducts || !newFactoryProducts.content) {
      return;
    }
    this.lastMxVersionPage = newFactoryProducts.last;
    this.factoryProductsForMxVersion = this.factoryProductsForMxVersion.concat(
      ...newFactoryProducts.content
    );
    this.mxVersionPageIndex++;

    const uniqueSoftwareVersions =
      this.getUniqueSoftwareProductByMxVersionRelativeToCurrentDropdown(
        newFactoryProducts
      );

    if (uniqueSoftwareVersions.length == 0 && !this.lastMxVersionPage) {
      this.mxVersionPageIndexSubject.next(this.mxVersionPageIndex);
    } else {
      this.mxVersionDropdown = this.mxVersionDropdown.concat(
        uniqueSoftwareVersions
      );
      this.mxVersionDropdownSignal.set(this.mxVersionDropdown);
    }
  }

  private getUniqueSoftwareProductByMxVersionRelativeToCurrentDropdown(
    newFactoryProducts: FactoryProducts
  ) {
    return newFactoryProducts.content
      .filter(
        (product: FactoryProduct, index, self) =>
          index ===
          self.findIndex(
            (p: FactoryProduct) =>
              p.softwareProduct.version === product.softwareProduct.version
          )
      )
      .filter(
        (product: FactoryProduct) =>
          !this.mxVersionDropdown.some(
            (existingVersion) =>
              existingVersion.value === product.softwareProduct.version
          )
      )
      .map((product: FactoryProduct) => ({
        label: product.softwareProduct.version,
        value: product.softwareProduct.version,
      }));
  }

  private populateMxBuildIdDropdownOnSearchChangeAndScroll() {
    const searchObservableForBuild = this.mxBuildSearchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged((prev, curr) => prev == curr),
      tap(() => this.setupSearchForMxBuild())
    );

    const scrollObservableForBuild = this.mxBuildPageIndexSubject.pipe(
      distinctUntilChanged((prev, curr) => prev === curr)
    );

    combineLatest([
      searchObservableForBuild,
      scrollObservableForBuild,
      this.mxVersionChangeSubject,
    ])
      .pipe(
        switchMap(([searchKey, pageIndex, mxVersion]) =>
          this.getFactoryProductForSelectMxBuild(
            searchKey,
            this.projectId,
            pageIndex,
            mxVersion
          )
        ),
        takeUntil(this.componentDestroy$)
      )
      .subscribe({
        next: (fp) => {
          this.loadNewFactoryProductsForMxBuild(fp);
        },
      });
  }

  private setupSearchForMxBuild() {
    this.lastMxBuildPage = false;
    this.mxBuildPageIndex = 0;
    this.mxBuildPageIndexSubject.next(0);
    this.mxBuildIdDropdown = [];
    this.mxbuildIdDropdownSignal.set(this.mxBuildIdDropdown);
  }

  private getFactoryProductForSelectMxBuild(
    searchKey: string,
    projectId: string,
    pageIndex: number,
    mxVersion: string
  ): Observable<FactoryProducts> {
    this.isSearchingForMxBuild = true;
    return this.artifactManagerService
      .getFactoryProducts(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildSearch: searchKey,
          pageSize: 10,
          pageIndex: pageIndex,
        },
        projectId
      )
      .pipe(
        catchError(() => {
          this.isSearchingForMxBuild = false;
          this.errorOutput.emit("Failed to fetch MX builds");
          return of();
        }),
        tap(() => {
          this.isSearchingForMxBuild = false;
        })
      );
  }

  private loadNewFactoryProductsForMxBuild(
    newFactoryProducts: FactoryProducts
  ): void {
    if (!newFactoryProducts || !newFactoryProducts.content) {
      return;
    }
    this.lastMxBuildPage = newFactoryProducts.last;
    this.factoryProductsForMxBuild = this.factoryProductsForMxBuild.concat(
      ...newFactoryProducts.content
    );
    this.mxBuildPageIndex++;

    let uniqueMxBuilds =
      this.getUniqueSoftwareProductByMxBuildRelativeToCurrentDropdown(
        newFactoryProducts
      );

    if (this.mxBuildSearchKey) {
      uniqueMxBuilds = uniqueMxBuilds.filter((build) =>
        build.value.buildId
          .toUpperCase()
          .includes(this.mxBuildSearchKey.toUpperCase())
      );
    }

    if (uniqueMxBuilds.length == 0 && !this.lastMxBuildPage) {
      this.mxBuildPageIndexSubject.next(this.mxBuildPageIndex);
    } else {
      this.mxBuildIdDropdown = this.mxBuildIdDropdown.concat(uniqueMxBuilds);
      this.mxbuildIdDropdownSignal.set(this.mxBuildIdDropdown);
      if (this.mxBuildIdDropdown.length === 1 && !this.mxBuildId) {
        this.selectedMxBuildId = this.mxBuildIdDropdown[0].value;
        this.mxBuildIdChange.emit(this.selectedMxBuildId);
      }
    }
  }

  private getUniqueSoftwareProductByMxBuildRelativeToCurrentDropdown(
    newFactoryProducts: FactoryProducts
  ) {
    return newFactoryProducts.content
      .flatMap((factoryProduct: FactoryProduct) =>
        factoryProduct.softwareProduct.builds.map((build) => ({
          build,
          parent: factoryProduct.parent,
        }))
      )
      .filter(({ build }) => !build.purged)
      .filter(
        ({ build, parent }, index, self) =>
          index ===
          self.findIndex(
            (b) =>
              b.build.mxBuild.buildId === build.mxBuild.buildId &&
              b.parent?.id === parent?.id
          )
      )
      .filter(
        ({ build, parent }) =>
          !this.mxBuildIdDropdown.some(
            (existingBuild) =>
              existingBuild.value.buildId === build.mxBuild.buildId &&
              existingBuild.value.parentId === parent?.id
          )
      )
      .map(({ build, parent }) => ({
        label: parent
          ? `${this.customString}${build.mxBuild.buildId}`
          : build.mxBuild.buildId,
        value: { buildId: build.mxBuild.buildId, parentId: parent?.id },
      }));
  }

  onSelectMxBuildId(mxBuildId: MxBuildIdDropdownValue | undefined) {
    this.mxBuildIdChange.emit(mxBuildId);
    this.parentFactoryProductId = mxBuildId?.parentId;
  }

  onMxBuildSearchKeyChange(event: string) {
    this.mxBuildSearchSubject.next(event);
  }

  clearMxBuildSearchKey(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    this.mxBuildSearchKey = "";
    this.mxBuildSearchSubject.next("");
  }

  handleMxBuildScroll = (event: LazyLoadEvent): void => {
    if (this.shouldScrollFactoryProductsForMxBuild(event.last ?? 0)) {
      this.mxBuildPageIndexSubject.next(this.mxBuildPageIndex);
      this.mxBuildSearchSubject.next(this.mxBuildSearchKey);
    }
  };

  private shouldScrollFactoryProductsForMxBuild(last: number): boolean {
    return (
      !this.lastMxBuildPage &&
      this.mxBuildIdDropdown.length < last + this.itemsStep &&
      !this.isSearchingForMxBuild
    );
  }

  getMxBuildIdLabel(mxBuildId: MxBuildIdDropdownValue): string {
    return mxBuildId.parentId
      ? `${this.customString}${mxBuildId.buildId}`
      : mxBuildId.buildId;
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
