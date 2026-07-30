# Flattened spec files

Every file here is a copy of a spec that lives elsewhere in the tree. They are
flattened so you can pull them out of a downloaded zip one at a time; each one
still has to go back to the path below, next to the component it covers.

Paths are relative to `libs/` in the full repo.

| File | Destination | Status |
| --- | --- | --- |
| `definition-input-group.component.spec.ts` | `domains/business-process/ui/src/lib/definition-input-group/` | **new** |
| `dqg-from-new-branch-parameters.component.spec.ts` | `domains/business-process/composite-widget/src/lib/validation-process/executor/configuration-parameters/dqg-parameters/from-new-branch/` | **new** |
| `toast-message.service.spec.ts` | `shared/ui/primitive/src/lib/toast/` | extended — adds `showWarning` |
| `validation-templates-dialog.component.spec.ts` | `domains/business-process/composite-widget/src/lib/validation-process/templates-dialog/` | extended — adds dialog locking + cancel |
| `upgrade-templates-dialog.component.spec.ts` | `domains/business-process/composite-widget/src/lib/upgrade-process/templates-dialog/` | extended — adds dialog locking + cancel |
| `build-and-test-templates-dialog.component.spec.ts` | `domains/business-process/composite-widget/src/lib/build-and-test/templates-dialog/` | extended — adds dialog locking + cancel, and the backport executor |
| `final-product-from-existing-branch.component.spec.ts` | `domains/business-process/composite-widget/src/lib/validation-process/executor/configuration-parameters/from-existing-branch/` | extended — pins the unsubmittable-run fix |

The four marked *extended* are whole-file replacements: they contain the tests
that were already there plus the new ones, so copy them over the existing file
rather than trying to merge.

## Not included

`upgrade-factory-product-input.component.ts` was requested but does not exist in
this repository — only in the full workspace. No tests were written for it,
because doing so without reading the component would have meant guessing at its
inputs, outputs and template. Add the file here (or paste it) and the spec can
be written against what it actually does.

## Delete this folder before committing

It is a delivery convenience, not part of the source tree. The same files are
already in their real locations in this branch.
