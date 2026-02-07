
export enum TemplateType {
  FORMAL = 'FORMAL',
  ACADEMIC = 'ACADEMIC',
  MODERN = 'MODERN'
}

export enum PageSize {
  A4 = 'A4',
  LETTER = 'LETTER'
}

export enum FontType {
  TIMES = 'Times New Roman, serif',
  GEORGIA = 'Georgia, serif',
  INTER = 'Inter, sans-serif',
  ARIAL = 'Arial, sans-serif'
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface CoverPageData {
  universityName: string;
  universityLogo: string | null;
  department: string;
  courseTitle: string;
  courseCode: string;
  reportTitle: string;
  assignmentType: string;
  professorName: string;
  professorDesignation: string; // New field
  students: Student[];
  session: string;
  submissionDate: string;
  diagnosis: string;
  customFields: CustomField[];
  
  // Styling
  template: TemplateType;
  font: FontType;
  titleFontSize: number;
  detailsFontSize: number;
  accentColor: string;
  pageSize: PageSize;
  showLogo: boolean;
  showFooter: boolean;
  alignment: 'center' | 'left';
}
