import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { SelectChangeEvent, Select, SelectModule } from "primeng/select";
import { ToastMessageService } from "@mxflow/ui/alert";
import { LazyLoadEvent } from "primeng/api";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { CommonModule } from "@angular/common";
import { MxDeployPackageDropdownStateService } from "./mxdeploy-package-dropdown-state.service";
import { MxDeployPackage } from "../model/mxdeploy-package";
import { Version } from "../../version/version";
import { VersionType } from "../../version/version-type";
import { MavenBuildVersion } from "../../version/maven-build/model/maven-build-version";
import { MxBuildVersion } from "../../version/mxbuild/model/mxbuild-version";
import { MxDeployPackageDropdownDefaultSelectionMode } from "../model/mxdeploy-package-dropdown-default-selection-mode";
import { combineLatest } from "rxjs";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";

@Component({
  selector: "mxevolve-mxdeploy-package-dropdown-input",
  imports: [
    FormsModule,
    InputTextModule,
    CommonModule,
    IconField,
    InputIcon,
    SelectModule,
  ],
  providers: [ToastMessageService],
  templateUrl: "./mxdeploy-package-dropdown-input.component.html",
})
export class MxDeployPackageDropdownInputComponent {
  @ViewChild(Select) dropdown: Select;
  private mxDeployPackageStateService = inject(
    MxDeployPackageDropdownStateService
  );

  itemHeight = 40;
  itemsStep = 5;

  handleScroll = (event: LazyLoadEvent): void => {
    const { first, last } = event;
    if (this.shouldLoadMoreData(first, last)) {
      this.mxDeployPackageStateService.setLastFetchedElement(last ?? 0);
      this.mxDeployPackageStateService.setPageIndex(this.pageIndex() + 1);
    }
  };

  @Input() set projectId(value: string) {
    if (value) {
      this.mxDeployPackageStateService.setProjectId(value);
      this.resetScroll();
    }
  }

  @Output() clearEvent = new EventEmitter<void>();

  @Input() set customMxDeployPackageId(value: string | undefined) {
    this.mxDeployPackageStateService.setCustomMxDeployPackageId(value);
  }

  @Input() set dropdownDefaultSelectionMode(
    value: MxDeployPackageDropdownDefaultSelectionMode
  ) {
    this.mxDeployPackageStateService.setDropdownDefaultSelectionMode(value);
  }

  @Output() selectedMxDeployPackageChange = new EventEmitter<
    MxDeployPackage | undefined
  >();
  pageIndex = this.mxDeployPackageStateService.pageIndex;
  lastFetchedElement = this.mxDeployPackageStateService.lastFetchedElement;
  mxDeployPackageDropdownOptions =
    this.mxDeployPackageStateService.mxDeployPackageDropdownOptions;
  isLastPage = this.mxDeployPackageStateService.isLastPage;
  selectedOption = this.mxDeployPackageStateService.selectedOption;
  selectedOptionValidity = computed(() => {
    const selectedOption = this.selectedOption();
    return selectedOption === undefined || selectedOption.label !== "";
  });
  mxDeployPackageSearchKey = this.mxDeployPackageStateService.searchKey;
  isLoadingData = this.mxDeployPackageStateService.isLoadingData;

  constructor() {
    this.setSelectedMxDeployPackage();
    this.emitSelectedMxDeployPackageOnChange();
  }

  clearSelectedOption() {
    this.mxDeployPackageStateService.setSelectedOption({
      label: "",
      value: undefined,
    });
  }

  resetSelectedOption() {
    this.mxDeployPackageStateService.setSelectedOption(undefined);
  }

  handleMxDeployPackageSelected(event: SelectChangeEvent) {
    const mxDeployPackage = event.value as MxDeployPackage;
    if (mxDeployPackage) {
      this.mxDeployPackageStateService.setSelectedOption({
        label: `${mxDeployPackage.type}-${this.getVersion(
          mxDeployPackage.version
        )}`,
        value: mxDeployPackage,
      });
    } else {
      this.mxDeployPackageStateService.setSelectedOption(undefined);
    }
  }

  handleSearchKeyInputChange(input: string) {
    this.mxDeployPackageStateService.setSearchKey(input);
    this.resetScroll();
  }

  clearSearchKey(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    this.mxDeployPackageStateService.setSearchKey(undefined);
    this.resetScroll();
  }

  resetSearchKey() {
    this.mxDeployPackageStateService.setSearchKey(undefined);
    this.resetScroll();
  }

  private setSelectedMxDeployPackage() {
    combineLatest([
      toObservable(this.mxDeployPackageDropdownOptions),
      toObservable(
        this.mxDeployPackageStateService.dropdownDefaultSelectionModeSignal
      ),
      toObservable(this.mxDeployPackageStateService.customMxDeployPackage),
    ]).subscribe(([options, dropdownSelectionMode, customMxDeployPackage]) => {
      if (
        dropdownSelectionMode ===
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      ) {
        const option = customMxDeployPackage
          ? {
              label: this.getVersion(customMxDeployPackage.version),
              value: customMxDeployPackage,
            }
          : undefined;
        if (this.mxDeployPackageStateService.pageIndex() === 0) {
          this.mxDeployPackageStateService.setSelectedOption(option);
        }
      } else if (this.mxDeployPackageStateService.pageIndex() === 0) {
        this.mxDeployPackageStateService.setSelectedOption(options[0]);
      }
    });
  }

  private emitSelectedMxDeployPackageOnChange() {
    toObservable(this.selectedOption)
      .pipe(takeUntilDestroyed())
      .subscribe((selectedOption) => {
        if (selectedOption?.label === "") {
          this.clearEvent.emit();
        } else {
          this.selectedMxDeployPackageChange.emit(selectedOption?.value);
        }
      });
  }

  private resetScroll() {
    this.mxDeployPackageStateService.setPageIndex(0);
    this.mxDeployPackageStateService.setLastFetchedElement(-1);
  }

  private shouldLoadMoreData(
    first: number | undefined,
    last: number | undefined
  ) {
    return (
      first &&
      last &&
      !this.isLoadingData() &&
      !this.isLastPage() &&
      this.lastFetchedElement() < last
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

  closeDialog() {
    this.dropdown.hide();
  }
}
