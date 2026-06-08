import { computed, Injectable, signal, Signal } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import {
  FetchMxDeployPackagesFilter,
  MxDeployPackage,
  MxDeployPackagesPage,
} from "../model/mxdeploy-package";
import { MxDeployPackageDropdownOption } from "./mxdeploy-package-dropdown-option.model";
import { ArtifactMxDeployPackageService } from "../mxdeploy-package.service";
import { Version } from "../../version/version";
import { VersionType } from "../../version/version-type";
import { MavenBuildVersion } from "../../version/maven-build/model/maven-build-version";
import { MxBuildVersion } from "../../version/mxbuild/model/mxbuild-version";
import { MxDeployPackageDropdownDefaultSelectionMode } from "../model/mxdeploy-package-dropdown-default-selection-mode";

@Injectable()
export class MxDeployPackageDropdownStateService {
  private defaultPageIndex = 0;
  private defaultPageSize = 10;
  private emptyPage: MxDeployPackagesPage = {
    content: [],
    size: 0,
    number: 0,
    totalPages: 0,
    totalElements: 0,
    last: true,
  };
  private debounceTime = 100;

  private projectIdSubject = new Subject<string>();
  private projectId$ = this.projectIdSubject.asObservable();

  private pageIndexSubject = new BehaviorSubject<number>(this.defaultPageIndex);
  private pageIndex$ = this.pageIndexSubject
    .asObservable()
    .pipe(distinctUntilChanged(), takeUntilDestroyed());
  readonly pageIndex: Signal<number>;
  errorMessageSubject = new Subject<string>();

  private customMxDeployPackageIdSubject = new Subject<string | undefined>();
  private customMxDeployPackageId$ =
    this.customMxDeployPackageIdSubject.asObservable();
  private dropdownDefaultSelectionModeSubject =
    new BehaviorSubject<MxDeployPackageDropdownDefaultSelectionMode>(
      MxDeployPackageDropdownDefaultSelectionMode.LATEST
    );
  private dropdownDefaultSelectionMode$ =
    this.dropdownDefaultSelectionModeSubject.asObservable();
  readonly dropdownDefaultSelectionModeSignal: Signal<MxDeployPackageDropdownDefaultSelectionMode> =
    toSignal(this.dropdownDefaultSelectionMode$, {
      initialValue: MxDeployPackageDropdownDefaultSelectionMode.LATEST,
    });
  private searchKeySubject = new BehaviorSubject<string | undefined>(undefined);
  private searchKey$ = this.searchKeySubject
    .asObservable()
    .pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      takeUntilDestroyed()
    );
  readonly searchKey: Signal<string | undefined>;

  private mxDeployPackagesPage$: Observable<MxDeployPackagesPage>;
  readonly mxDeployPackagesPage: Signal<MxDeployPackagesPage>;

  readonly customMxDeployPackage$: Observable<MxDeployPackage>;
  readonly customMxDeployPackage: Signal<MxDeployPackage | undefined>;

  private readonly mxDeployPackages$: Observable<MxDeployPackage[]>;
  readonly mxDeployPackages: Signal<MxDeployPackage[]>;

  private selectedOptionSubject = new Subject<
    MxDeployPackageDropdownOption | undefined
  >();
  private selectedOption$ = this.selectedOptionSubject.asObservable();
  readonly selectedOption: Signal<MxDeployPackageDropdownOption | undefined>;

  readonly newMXdeployPackageDropdownOptions = computed(() =>
    this.getDropdownOptions(this.mxDeployPackages())
  );
  readonly mxDeployPackageDropdownOptions: Signal<
    MxDeployPackageDropdownOption[]
  >;
  readonly isLastPage = computed(() => this.mxDeployPackagesPage().last);
  readonly isLoadingData = signal(false);

  private lastFetchedElementSubject = new BehaviorSubject<number>(-1);
  private lastFetchedElement$ = this.lastFetchedElementSubject
    .asObservable()
    .pipe(distinctUntilChanged(), takeUntilDestroyed());
  readonly lastFetchedElement: Signal<number>;

  constructor(private mxDeployPackageService: ArtifactMxDeployPackageService) {
    this.customMxDeployPackage$ = combineLatest([
      this.projectId$,
      this.customMxDeployPackageId$,
    ]).pipe(
      switchMap(([projectId, customMxDeployPackageId]) => {
        return customMxDeployPackageId
          ? this.mxDeployPackageService
              .getMxDeployPackageById(customMxDeployPackageId, projectId)
              .pipe(
                catchError(() => {
                  this.setLoadingData(false);
                  this.errorMessageSubject.next(
                    "Failed to fetch custom MXdeploy Package"
                  );
                  return EMPTY;
                })
              )
          : EMPTY;
      }),
      shareReplay(1)
    );

    this.mxDeployPackagesPage$ = combineLatest([
      this.pageIndex$,
      this.searchKey$,
    ]).pipe(
      tap(() => this.setLoadingData(true)),
      switchMap(([pageIndex, searchKey]) => {
        return this.mxDeployPackageService
          .getAllMxDeployPackages(
            this.getMXdeployPackageFilters(pageIndex, searchKey)
          )
          .pipe(
            catchError(() => {
              this.setLoadingData(false);
              this.errorMessageSubject.next(
                "Failed to fetch MXdeploy Packages"
              );
              return of(this.emptyPage);
            })
          );
      }),
      tap(() => this.setLoadingData(false)),
      shareReplay(1),
      takeUntilDestroyed()
    );

    this.mxDeployPackages$ = combineLatest([
      this.customMxDeployPackage$.pipe(startWith(null)),
      this.mxDeployPackagesPage$,
      this.dropdownDefaultSelectionMode$,
      this.searchKey$,
    ]).pipe(
      map(
        ([
          customMxDeployPackage,
          mxDeployPackagesPage,
          dropdownDefaultSelectionMode,
          searchkey,
        ]) => {
          const mxDeployPackagesList = this.shouldIncludeCustomMxDeployPackage(
            customMxDeployPackage,
            searchkey
          )
            ? this.getMxDeployPackagesList(
                customMxDeployPackage,
                mxDeployPackagesPage
              )
            : this.getMxDeployPackagesList(null, mxDeployPackagesPage);
          return dropdownDefaultSelectionMode ==
            MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
            ? mxDeployPackagesList
            : this.sortMxDeployPackagesByCreationDateDesc(mxDeployPackagesList);
        }
      )
    );
    this.mxDeployPackages = toSignal(this.mxDeployPackages$, {
      initialValue: [],
    });
    this.customMxDeployPackage = toSignal(this.customMxDeployPackage$);
    const mxdeployPackageDropdownOptions$ = toObservable(
      this.newMXdeployPackageDropdownOptions
    ).pipe(
      switchMap((newOptions) =>
        this.addNewMxDeployPackageDropdownOptions(newOptions)
      ),
      takeUntilDestroyed()
    );
    this.pageIndex = toSignal(this.pageIndex$, { initialValue: 0 });
    this.lastFetchedElement = toSignal(this.lastFetchedElement$, {
      initialValue: -1,
    });
    this.mxDeployPackagesPage = toSignal(this.mxDeployPackagesPage$, {
      initialValue: this.emptyPage,
    });
    this.mxDeployPackageDropdownOptions = toSignal(
      mxdeployPackageDropdownOptions$,
      {
        initialValue: [],
      }
    );
    this.selectedOption = toSignal(this.selectedOption$);
    this.searchKey = toSignal(this.searchKey$);
  }

  private sortMxDeployPackagesByCreationDateDesc(
    mxDeployPackagesList: MxDeployPackage[]
  ) {
    return mxDeployPackagesList.sort((mxdp1, mxdp2) => {
      return (
        Date.parse(mxdp2.createdOn?.toString()) -
        Date.parse(mxdp1.createdOn?.toString())
      );
    });
  }

  private shouldIncludeCustomMxDeployPackage(
    customMxDeployPackage: MxDeployPackage | null,
    searchKey: string | undefined
  ) {
    return (
      customMxDeployPackage &&
      (!searchKey ||
        customMxDeployPackage.type
          .toLowerCase()
          .includes(searchKey.toLowerCase()) ||
        this.getVersion(customMxDeployPackage.version).includes(
          searchKey.toLowerCase()
        ))
    );
  }

  private getMxDeployPackagesList(
    customMxDeployPackage: MxDeployPackage | null,
    mxDeployPackagesPage: MxDeployPackagesPage
  ) {
    return customMxDeployPackage
      ? [customMxDeployPackage, ...(mxDeployPackagesPage.content || [])]
      : mxDeployPackagesPage.content || [];
  }

  setCustomMxDeployPackageId(customMxDeployPackageId: string | undefined) {
    this.customMxDeployPackageIdSubject.next(customMxDeployPackageId);
  }

  setDropdownDefaultSelectionMode(
    dropdownDefaultSelectionMode: MxDeployPackageDropdownDefaultSelectionMode
  ) {
    this.dropdownDefaultSelectionModeSubject.next(dropdownDefaultSelectionMode);
  }
  setProjectId(projectId: string) {
    this.projectIdSubject.next(projectId);
  }
  setSearchKey(searchKey: string | undefined) {
    this.searchKeySubject.next(searchKey);
  }
  setPageIndex(index: number) {
    this.pageIndexSubject.next(index);
  }

  setSelectedOption(option: MxDeployPackageDropdownOption | undefined) {
    this.selectedOptionSubject.next(option);
  }

  setLastFetchedElement(last: number) {
    this.lastFetchedElementSubject.next(last);
  }

  private setLoadingData(isLoading: boolean): void {
    this.isLoadingData.set(isLoading);
  }

  private getMXdeployPackageFilters(
    pageIndex: number,
    searchKey: string | undefined
  ): FetchMxDeployPackagesFilter {
    return {
      pageIndex: pageIndex,
      pageSize: this.defaultPageSize,
      searchKey: searchKey,
    };
  }

  private getDropdownOptions(
    mxDeployPackages: MxDeployPackage[]
  ): MxDeployPackageDropdownOption[] {
    if (mxDeployPackages && mxDeployPackages.length > 0) {
      return mxDeployPackages.map((mxDeployPackage) =>
        this.buildDropdownOption(mxDeployPackage)
      );
    }
    return [];
  }

  private buildDropdownOption(
    mxDeployPackage: MxDeployPackage
  ): MxDeployPackageDropdownOption {
    return {
      label: `${mxDeployPackage.type}-${this.getVersion(
        mxDeployPackage.version
      )}`,
      value: mxDeployPackage,
    };
  }

  private addNewMxDeployPackageDropdownOptions(
    newOptions: MxDeployPackageDropdownOption[]
  ) {
    if (this.pageIndex() === 0) {
      return of(this.getUniqueDropdownOptions(newOptions));
    } else {
      return of(
        Array.from(
          this.getUniqueDropdownOptions(
            this.mxDeployPackageDropdownOptions().concat(...newOptions)
          )
        )
      );
    }
  }

  private getUniqueDropdownOptions(options: MxDeployPackageDropdownOption[]) {
    return Array.from(
      new Map(options.map((option) => [option.value?.id, option])).values()
    );
  }

  private getVersion(version: Version) {
    if (version.type === VersionType.MAVEN) {
      const mavenVersion = version as MavenBuildVersion;
      return mavenVersion.version;
    }
    if (version.type === VersionType.MXBUILD) {
      const mxBuildVersion = version as MxBuildVersion;
      return mxBuildVersion.version;
    }
    return "";
  }
}
