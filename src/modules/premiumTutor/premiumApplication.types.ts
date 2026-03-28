export interface DocumentInput {
  url: string;
  s3Key: string;
  fileType: "degree_certificate" | "id_proof" | "experience_letter" | "other";
  fileName: string;
}

export interface SubmitApplicationInput {
  tutorId: string;
  fullName: string;
  dateOfBirth: Date;
  nationalIdNumber?: string;
  highestDegree: "diploma" | "bachelor" | "master" | "phd" | "other";
  fieldOfStudy: string;
  institution: string;
  graduationYear?: number;
  subjectsTaught: string[];
  teachingLanguages?: string[];
  yearsOfExperience: number;
  experience: string;
  documents: DocumentInput[];
}

export interface GetAllApplicationsQuery {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
  search?: string;        // search by tutor name
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}