export interface Experience {
  id: string;
  company: string;
  role: string;
  type: string;
  start_date: string;
  end_date: string | null;
  location: string;
  highlights: string[];
  technologies: string[];
  url: string | null;
}
