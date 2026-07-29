// Icons
export {
  MxevolveIconComponent,
  type IconSize,
} from "./lib/icons/mxevolve-icon/mxevolve-icon.component";
export { MX_ICON_NAMES } from "./lib/icons/mxevolve-icon/names/mx-icon-names";
export { CUSTOM_ICONS_PATH } from "./lib/icons/custom-icons/custom-icon-urls.token";

// Illustrations
export {
  MxevolveIllustrationComponent,
  type IllustrationSize,
} from "./lib/illustrations/mxevolve-illustration.component";
export { ILLUSTRATIONS_PATH } from "./lib/illustrations/illustration-urls.token";

export { DateDisplayComponent } from "./lib/date-display/date-display.component";
export { CommitIdDisplayComponent } from "./lib/commit-id-display/commit-id-display.component";

export { DurationDisplayComponent } from "./lib/duration-display/duration-display.component";
export { DATE_DISPLAY_FORMAT } from "./lib/date-display/date-display.component";

// Toast
export { ToastMessageService } from "./lib/toast/toast-message.service";
export { ToastMessageData } from "./lib/toast/toast-message-data";

export { StepperComponent } from "./lib/stepper/stepper.component";
export { StepComponent } from "./lib/stepper/step.component";
export { type StepDefinition, type StepStatus } from "./lib/stepper/step";

// Present on disk but previously absent from this barrel: `shared/` was merged
// in additively (rsync --ignore-existing) and the repo's older index.ts was
// kept, so these five directories shipped without exports. Every one of them is
// imported through this barrel elsewhere in the tree, so the libraries that use
// them could not compile.
export { SkeletonComponent } from "./lib/skeleton/skeleton.component";
export { WarningAlertComponent } from "./lib/alert/warning-alert.component";
export { CopyToClipboardComponent } from "./lib/copy-to-clipboard/copy-to-clipboard.component";
export { ExpandableMessageComponent } from "./lib/expandable-message/expandable-message.component";
export { MultiPageDialogComponent } from "./lib/multi-page-dialog/multi-page-dialog.component";
export { MultiPageDialogPageDirective } from "./lib/multi-page-dialog/multi-page-dialog-page.directive";
