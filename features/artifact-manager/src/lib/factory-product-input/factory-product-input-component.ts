import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { ArtifactManagerService } from "../artifact-manager.service";
import { MxBuildIdDropdownValue } from "../software-product-selector/model/mxbuildid-dropdown-option";

@Component({
  selector: "mxevolve-factory-product-input",
  templateUrl: "./factory-product-input-component.html",
  standalone: false,
})
export class FactoryProductInputComponent implements OnInit, OnDestroy {
  private readonly componentDestroy$ = new Subject();

  @Input({ required: true }) projectId: string;
  @Input() requiredInput: boolean;
  @Input() factoryProductId?: string;
  @Input() mxVersion?: string;
  @Input() mxBuildId?: string;
  @Input() bipVersion?: string;
  @Input() bipBuildId?: string;
  parentId: string | undefined;
  @Output() mxVersionChange = new EventEmitter<string | undefined>();
  @Output() mxBuildIdChange = new EventEmitter<string | undefined>();
  @Output() bipVersionChange = new EventEmitter<string | undefined>();
  @Output() bipBuildIdChange = new EventEmitter<string | undefined>();
  @Output() factoryProductIdChange = new EventEmitter<string | undefined>();
  @Output() errorOutput = new EventEmitter<string>();

  constructor(private artifactManagerService: ArtifactManagerService) {}

  ngOnInit(): void {
    if (this.factoryProductId) {
      const factoryProductId = this.factoryProductId;
      this.artifactManagerService
        .getFactoryProductById(factoryProductId, this.projectId)
        .pipe(takeUntil(this.componentDestroy$))
        .subscribe({
          next: (factoryProduct) => {
            this.parentId = factoryProduct.parent?.id;
            if (!this.mxVersion) {
              this.mxVersion = factoryProduct.softwareProduct.version;
              this.mxVersionChange.emit(this.mxVersion);
            }

            if (!this.mxBuildId) {
              this.mxBuildId = factoryProduct.softwareProduct.builds.find(
                (build) => build.mxBundles && build.mxBundles.length > 0
              )?.mxBuild.buildId;
              this.mxBuildIdChange.emit(this.mxBuildId);
            }

            if (!this.bipVersion) {
              this.bipVersion = factoryProduct.configurationComponents
                ? factoryProduct.configurationComponents[0]?.version
                : undefined;
              this.bipVersionChange.emit(this.bipVersion);
            }

            if (!this.bipBuildId) {
              this.bipBuildId = factoryProduct.configurationComponents
                ? factoryProduct.configurationComponents[0]?.builds.find(
                    (build) => build.mxBundles && build.mxBundles.length > 0
                  )?.mxBuild.buildId
                : undefined;
              this.bipBuildIdChange.emit(this.bipBuildId);
            }
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next({});
    this.componentDestroy$.complete();
  }

  onMxVersionChange(mxVersion: string | undefined) {
    this.mxVersion = mxVersion;
    this.bipVersion = undefined;
    this.bipBuildId = undefined;
    this.mxVersionChange.emit(mxVersion);
    this.bipVersionChange.emit(undefined);
    this.bipBuildIdChange.emit(undefined);
    this.factoryProductIdChange.emit(undefined);
  }

  onMxBuildIdChange(mxBuildId: MxBuildIdDropdownValue | undefined) {
    this.mxBuildId = mxBuildId?.buildId;
    this.parentId = mxBuildId?.parentId;
    this.bipVersion = undefined;
    this.bipBuildId = undefined;
    this.mxBuildIdChange.emit(mxBuildId?.buildId);
    this.bipVersionChange.emit(undefined);
    this.bipBuildIdChange.emit(undefined);
    this.factoryProductIdChange.emit(undefined);
  }

  onBipVersionChange(bipVersion: string | undefined) {
    this.bipVersion = bipVersion;
    this.bipVersionChange.emit(bipVersion);
  }

  onBipBuildIdChange(bipBuildId: string | undefined) {
    this.bipBuildId = bipBuildId;
    this.bipBuildIdChange.emit(bipBuildId);
  }

  onFactoryProductIdChange(factoryProductId: string | undefined) {
    this.factoryProductId = factoryProductId;
    this.factoryProductIdChange.emit(factoryProductId);
  }

  onError(errorMessage: string) {
    this.errorOutput.emit(errorMessage);
  }
}
