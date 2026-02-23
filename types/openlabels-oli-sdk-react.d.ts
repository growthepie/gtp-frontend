import type { AttestationDiagnostic, AttestationDiagnostics } from "@openlabels/oli-sdk";

declare module "@openlabels/oli-sdk/dist/attest-ui.entry" {
  interface BulkCsvAttestUIOptions {
    allowedFields?: string[];
  }

  interface BulkCsvAttestUIController {
    getRowDiagnostics(rowIndex: number): AttestationDiagnostics;
    getFieldDiagnostics(rowIndex: number, field: string): AttestationDiagnostics;
    getFieldError(rowIndex: number, field: string): AttestationDiagnostic | undefined;
  }
}

declare module "@openlabels/oli-sdk/react" {
  export * from "@openlabels/oli-sdk/dist/attest-ui.entry";
  export * from "@openlabels/oli-sdk/dist/react";
}
