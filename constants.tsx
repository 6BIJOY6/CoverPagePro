
import { CoverPageData, TemplateType, FontType, PageSize } from './types';

export const INITIAL_DATA: CoverPageData = {
  universityName: 'Global Academic University',
  universityLogo: null,
  department: 'Department of Computer Science & Engineering',
  courseTitle: 'Advanced Web Development',
  courseCode: 'CS-402',
  reportTitle: 'Building Scalable Modern Web Architectures with React and Distributed Systems',
  assignmentType: 'Assignment',
  professorName: 'Dr. Sarah Mitchell',
  professorDesignation: 'Assistant Professor',
  students: [
    { id: 'initial-1', name: 'John Doe', studentId: 'CSE-2023-085' }
  ],
  session: 'Fall 2024 - 2025',
  submissionDate: new Date().toISOString().split('T')[0],
  diagnosis: '',
  customFields: [],
  
  template: TemplateType.FORMAL,
  font: FontType.TIMES,
  titleFontSize: 36,
  detailsFontSize: 16,
  accentColor: '#1e40af',
  pageSize: PageSize.A4,
  showLogo: true,
  showFooter: true,
  alignment: 'center'
};

export const PAGE_DIMENSIONS = {
  [PageSize.A4]: { width: '210mm', height: '297mm' },
  [PageSize.LETTER]: { width: '215.9mm', height: '279.4mm' }
};
