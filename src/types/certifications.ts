export interface Certification {
  title: string;
  issuer: string;
  date: string | null;
  credential_id: string | null;
  skills: string[];
  url: string | null;
  /** Issuer logo image path */
  badge?: string;
}
