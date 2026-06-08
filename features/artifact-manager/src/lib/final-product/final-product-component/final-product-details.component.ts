import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  catchError,
  EMPTY,
  Observable,
  shareReplay,
  Subject,
  takeUntil,
  tap,
} from "rxjs";
import { FinalProduct } from "../model/final-product";
import { AsyncPipe, NgClass } from "@angular/common";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { FinalProductStatusResolverService } from "./final-product-status-resolver/final-product-status-resolver.service";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { FinalProductService } from "../final-product.service";

@Component({
  selector: "mxevolve-final-product-details-component",
  templateUrl: "./final-product-details.component.html",
  imports: [
    SkeletonModule,
    TagModule,
    NgClass,
    ProgressSpinnerModule,
    AsyncPipe,
  ],
  providers: [FinalProductStatusResolverService, FinalProductService],
})
export class FinalProductDetailsComponent implements OnInit, OnDestroy {
  @Input() finalProductId: string;
  @Input({ required: true }) projectId: string;
  @Output() errorEventEmitter = new EventEmitter<string>();

  status: {
    severity: "success" | "secondary" | "info" | "warn" | "danger" | "contrast";
    label: string;
    icon: string;
  };

  finalProduct$: Observable<FinalProduct>;

  destroy$ = new Subject();

  constructor(
    private finalProductService: FinalProductService,
    private statusResolverService: FinalProductStatusResolverService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit() {
    this.finalProduct$ = this.finalProductService
      .getFinalProductById(this.finalProductId, this.projectId)
      .pipe(
        tap((finalProduct) => {
          this.status = this.statusResolverService.resolveStatus(
            finalProduct.state
          );
        }),
        catchError((error) => {
          this.errorEventEmitter.emit(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$),
        shareReplay(1)
      );
  }
}
