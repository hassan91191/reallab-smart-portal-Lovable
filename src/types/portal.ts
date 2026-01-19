export interface LabConfig {
  title: string;
  subtitle?: string;
  logoUrl?: string;
}

export interface PatientFile {
  fileId: string;
  name: string;
  mimeType?: string;
  size?: number;
  modifiedTime?: string;
}

export type PortalState = 
  | { status: 'missing-lab' }
  | { status: 'needs-patient-id'; lab: string }
  | { status: 'loading'; lab: string; patientId: string }
  | { status: 'loaded'; lab: string; patientId: string; config: LabConfig; files: PatientFile[] }
  | { status: 'error'; lab: string; patientId?: string; message: string };
