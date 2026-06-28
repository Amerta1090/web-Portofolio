export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  /** Quote / testimonial text */
  text: string;
  /** Avatar image path */
  avatar?: string;
  /** Company logo image path */
  company_logo?: string;
}
