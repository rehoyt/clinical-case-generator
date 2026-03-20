export type ComplexityLevel = 'Basic' | 'Intermediate' | 'Advanced';

export interface CaseInput {
  disease: string;
  ageRange: string;
  biologicalSex: 'Male' | 'Female' | 'Other';
  race: string;
  complexity: ComplexityLevel;
  additionalInstructions?: string;
}

export interface LabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'H' | 'L' | 'Normal';
}

export interface ImagingReport {
  modality: string;
  indication: string;
  findings: string;
  impression: string;
}

export interface PatientCase {
  id: string;
  timestamp: number;
  input: CaseInput;
  
  // 15 Sections
  demographics: {
    name: string;
    age: string;
    sex: string;
    race: string;
    occupation: string;
    maritalStatus: string;
    location?: string;
  };
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string[];
  medications: string[];
  allergies: string[];
  familyHistory: string;
  socialHistory: string;
  reviewOfSystems: string;
  physicalExam: {
    vitals: {
      bp: string;
      hr: string;
      rr: string;
      temp: string;
      spo2: string;
    };
    general: string;
    heent: string;
    cardiovascular: string;
    respiratory: string;
    abdomen: string;
    neurological: string;
    musculoskeletal: string;
    skin: string;
  };
  labs: LabResult[];
  imaging: ImagingReport[];
  differentialDiagnosis: string[];
  finalDiagnosis: string;
  discussionQuestions: {
    question: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    answer: string;
  }[];
  teachingPoints: string[];
  redHerrings?: string[];
}
