import { inject, Injectable } from "@angular/core";
import { FinalProduct } from "@mxflow/features/artifact-manager";
import { FormatDatePipe } from "@mxflow/pipe";
import { Router } from "@angular/router";

@Injectable()
export class FinalProductTableService {
  formatDatePipe = inject(FormatDatePipe);
  private router = inject(Router);

  getExpiryDate(finalProduct: FinalProduct): string {
    const date = finalProduct.expiryDate
      ? new Date(finalProduct.expiryDate)
      : undefined;
    const expiredStates = ["PURGING", "PURGED", "PURGE_FAILED"];
    if (!date) {
      return "N/A";
    }

    const now = new Date();
    if (
      date.getTime() < now.getTime() ||
      expiredStates.includes(finalProduct.state.toUpperCase())
    ) {
      return "Expired";
    }

    return this.formatDatePipe.transform(date.toLocaleDateString());
  }
  getRemainingDays(finalProduct: FinalProduct): string {
    const expiredStates = ["PURGING", "PURGED", "PURGE_FAILED"];
    const date = finalProduct.expiryDate
      ? new Date(finalProduct.expiryDate)
      : undefined;

    if (
      !date ||
      isNaN(date.getTime()) ||
      expiredStates.includes(finalProduct.state.toUpperCase())
    ) {
      return "N/A";
    }

    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) {
      return "N/A";
    }

    return Math.ceil(diff / (1000 * 60 * 60 * 24)).toString();
  }

  navigateToFactoryProductTable(factoryProductId: string): void {
    this.router.navigate(["global-operations/factory-products"], {
      queryParams: { id: factoryProductId },
    });
  }
}
