import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export interface ResultRecord {
  id: string;
  student: string | {
    id: string;
    admission_number: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  student_admission?: string;
  student_name?: string;
  examination_subject: string | {
    id: string;
    subject: {
      id: string;
      name: string;
      code: string;
    };
    examination: {
      id: string;
      name: string;
      term: string;
    };
    max_marks: number;
    pass_marks: number;
  };
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
  exam_id?: string;
  exam_name?: string;
  term_name?: string;
  academic_year_name?: string;
  marks_obtained: number;
  theory_marks?: number;
  practical_marks?: number;
  max_marks?: number;
  pass_marks?: number;
  percentage: number;
  is_passed: boolean;
  attendance_status?: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'EXPELLED';
  attendance_status_display?: string;
  grade?: {
    id: string;
    name: string;
    grade_point?: number;
    remarks?: string;
  };
  grade_name?: string;
  grade_point?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'PUBLISHED';
  status_display?: string;
  remarks?: string;
  submitted_by_name?: string;
  submitted_at?: string;
  verified_by_name?: string;
  verified_at?: string;
  approved_by_name?: string;
  approved_at?: string;
  published_by_name?: string;
  published_at?: string;
  reverted_by_name?: string;
  reverted_at?: string;
  revert_reason?: string;
}

export interface ExaminationTypeItem {
  id: string;
  name: string;
  code: string;
  description: string;
  default_weightage: number;
  is_active: boolean;
}

export interface ExaminationPeriodItem {
  id: string;
  name: string;
  academic_year: string;
  academic_year_name?: string;
  term: string;
  term_name?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  is_active: boolean;
  remarks?: string;
}

export interface Examination {
  id: string;
  name: string;
  exam_type: string;
  exam_type_display?: string;
  examination_type?: string;
  examination_type_name?: string;
  period?: string;
  period_name?: string;
  academic_year: string;
  academic_year_name?: string;
  term: string;
  term_name?: string;
  start_date: string;
  end_date: string;
  weightage: number;
  description?: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'RESULTS_PENDING' | 'PUBLISHED';
  status_display?: string;
  is_published: boolean;
  candidates_count?: number;
  subjects_count?: number;
  exam_subjects?: ExaminationSubjectItem[];
}

export interface ExaminationSubjectItem {
  id: string;
  examination: string;
  examination_name?: string;
  subject: string;
  subject_name: string;
  subject_code: string;
  class_obj: string;
  class_name: string;
  paper_code?: string;
  paper_name?: string;
  invigilator?: string;
  invigilator_name?: string;
  invigilator_display?: string;
  theory_weight?: number;
  practical_weight?: number;
  max_marks: number;
  pass_marks: number;
  exam_date?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  results_count?: number;
  candidates_count?: number;
}

export interface CandidateItem {
  id: string;
  examination: string;
  examination_name?: string;
  student: string;
  student_admission: string;
  student_name: string;
  class_name: string;
  stream_name?: string;
  index_number: string;
  eligibility_status: 'ELIGIBLE' | 'FLAGGED' | 'BLOCKED';
  fee_clearance: 'CLEARED' | 'CONDITIONAL' | 'BLOCKED';
  attendance_rate: number;
  notes?: string;
  registered_at?: string;
}

export interface GradeRule {
  id: string;
  name: string;
  min_score: number;
  max_score: number;
  grade_point: number;
  remark: string;
}

export interface CandidateScoreRow {
  student_id: string;
  admission_number: string;
  name: string;
  index_number: string;
  stream_name: string;
  eligibility_status: string;
  fee_clearance: string;
  attendance_rate: number;
  has_result: boolean;
  result_id?: string;
  marks_obtained?: number;
  theory_marks?: number;
  practical_marks?: number;
  percentage?: number;
  max_marks: number;
  pass_marks: number;
  is_passed?: boolean;
  grade?: string;
  status: string;
  remarks: string;
}

export interface CandidatesResponse {
  examination_subject_id: string;
  examination_name: string;
  subject_name: string;
  subject_code: string;
  paper_code?: string;
  paper_name?: string;
  class_name: string;
  max_marks: number;
  pass_marks: number;
  exam_date?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  total_candidates: number;
  candidates: CandidateScoreRow[];
}

export interface SubjectLedgerResponse {
  examination_subject_id: string;
  examination_name: string;
  subject_name: string;
  subject_code: string;
  class_name: string;
  max_marks: number;
  pass_marks: number;
  total_candidates: number;
  current_status: string;
  status_breakdown: {
    DRAFT: number;
    SUBMITTED: number;
    VERIFIED: number;
    APPROVED: number;
    PUBLISHED: number;
  };
  mean_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  audit_trail: {
    submitted_by?: string;
    submitted_at?: string;
    verified_by?: string;
    verified_at?: string;
    approved_by?: string;
    approved_at?: string;
    published_by?: string;
    published_at?: string;
  };
}

export interface ReportCardResponse {
  student: {
    id: string;
    admission_number: string;
    name: string;
    class_name: string;
    stream_name?: string;
  };
  examination: {
    id: string;
    name: string;
    exam_type: string;
    term: string;
    academic_year: string;
    is_published: boolean;
  };
  summary: {
    total_subjects: number;
    total_score: number;
    total_max_marks: number;
    average_percentage: number;
    overall_grade: string;
    total_gpa_points?: number;
    grade_point: number;
    remark: string;
  };
  subject_results: ResultRecord[];
}

export interface WorkflowTransitionResponse {
  success: boolean;
  action: string;
  transitioned_count: number;
  message: string;
}

export interface BulkEntryResponse {
  success?: boolean;
  partial_success?: boolean;
  message?: string;
  examination_subject_id?: string;
  status?: string;
  saved_count: number;
  errors?: string[];
}

export interface ClashCheckResponse {
  has_clashes: boolean;
  total_clashes: number;
  clashes: Array<{
    type: string;
    severity: string;
    date: string;
    room?: string;
    class_name?: string;
    invigilator?: string;
    message: string;
    slot_1: string;
    slot_2: string;
  }>;
}

export interface ExaminationAnalyticsResponse {
  examination_id: string;
  examination_name: string;
  status: string;
  is_published: boolean;
  total_candidates: number;
  total_papers: number;
  total_results: number;
  cohort_mean: number;
  pass_rate: number;
  grade_distribution: Record<string, { count: number; percentage: number }>;
  subject_performance: Array<{
    subject_id: string;
    subject_code: string;
    subject_name: string;
    class_name: string;
    max_marks: number;
    pass_marks: number;
    candidates_assessed: number;
    mean_percentage: number;
    pass_rate: number;
  }>;
}

export const resultService = {
  // ── Results & Scores ──
  async getResults(params?: QueryParams): Promise<PaginatedResponse<ResultRecord>> {
    const response = await apiClient.get<PaginatedResponse<ResultRecord>>('/results/', { params });
    return response.data;
  },

  async getResultById(id: string | number): Promise<ResultRecord> {
    const response = await apiClient.get<ResultRecord>(`/results/${id}/`);
    return response.data;
  },

  async submitMarks(payload: {
    student: string;
    examination_subject: string;
    marks_obtained: number;
    theory_marks?: number;
    practical_marks?: number;
    attendance_status?: string;
    remarks?: string;
  }): Promise<ResultRecord> {
    const response = await apiClient.post<ResultRecord>('/results/', payload);
    return response.data;
  },

  async bulkEntry(payload: {
    examination_subject_id: string;
    target_status?: 'DRAFT' | 'SUBMITTED';
    results: Array<{
      student_id: string;
      marks_obtained: number;
      theory_marks?: number;
      practical_marks?: number;
      attendance_status?: string;
      remarks?: string;
    }>;
  }): Promise<BulkEntryResponse> {
    const response = await apiClient.post<BulkEntryResponse>('/results/bulk_entry/', payload);
    return response.data;
  },

  async workflowTransition(payload: {
    action: 'submit' | 'verify' | 'approve' | 'publish' | 'revert';
    examination_subject_id?: string;
    examination_id?: string;
    result_ids?: string[];
    reason?: string;
  }): Promise<WorkflowTransitionResponse> {
    const response = await apiClient.post<WorkflowTransitionResponse>('/results/workflow_transition/', payload);
    return response.data;
  },

  async getSubjectLedger(examinationSubjectId: string): Promise<SubjectLedgerResponse> {
    const response = await apiClient.get<SubjectLedgerResponse>('/results/subject_ledger/', {
      params: { examination_subject_id: examinationSubjectId }
    });
    return response.data;
  },

  async getReportCard(studentId: string, examinationId: string): Promise<ReportCardResponse> {
    const response = await apiClient.get<ReportCardResponse>('/results/report_card/', {
      params: { student_id: studentId, examination_id: examinationId }
    });
    return response.data;
  },

  async getMyResults(params?: { student_id?: string; examination_id?: string }): Promise<{
    student_id: string;
    student_admission: string;
    student_name: string;
    class_name: string;
    summary: {
      total_subjects: number;
      total_marks: number;
      total_max_marks: number;
      average_percentage: number;
      overall_grade: string;
      grade_point: number;
      performance_summary: string;
      has_published_results: boolean;
    };
    results: ResultRecord[];
    available_examinations: Array<{ id: string; name: string; academic_year__name: string; term__name: string }>;
  }> {
    const response = await apiClient.get('/results/me/', { params });
    return response.data;
  },

  // ── Examinations ──
  async getExaminations(params?: QueryParams): Promise<PaginatedResponse<Examination>> {
    const response = await apiClient.get<PaginatedResponse<Examination>>('/examinations/', { params });
    return response.data;
  },

  async getExaminationById(id: string | number): Promise<Examination> {
    const response = await apiClient.get<Examination>(`/examinations/${id}/`);
    return response.data;
  },

  async createExamination(payload: Record<string, unknown>): Promise<Examination> {
    const response = await apiClient.post<Examination>('/examinations/', payload);
    return response.data;
  },

  async publishExamination(id: string): Promise<{ success: boolean; message: string; is_published: boolean; status: string }> {
    const response = await apiClient.post(`/examinations/${id}/publish/`);
    return response.data;
  },

  async syncCandidates(id: string): Promise<{ success: boolean; message: string; total_candidates: number; new_registrations: number }> {
    const response = await apiClient.post(`/examinations/${id}/sync_candidates/`);
    return response.data;
  },

  async getExaminationAnalytics(id: string): Promise<ExaminationAnalyticsResponse> {
    const response = await apiClient.get<ExaminationAnalyticsResponse>(`/examinations/${id}/analytics/`);
    return response.data;
  },

  // ── Examination Types & Periods ──
  async getExaminationTypes(params?: QueryParams): Promise<PaginatedResponse<ExaminationTypeItem>> {
    const response = await apiClient.get<PaginatedResponse<ExaminationTypeItem>>('/examinations/types/', { params });
    return response.data;
  },

  async createExaminationType(payload: Record<string, unknown>): Promise<ExaminationTypeItem> {
    const response = await apiClient.post<ExaminationTypeItem>('/examinations/types/', payload);
    return response.data;
  },

  async getExaminationPeriods(params?: QueryParams): Promise<PaginatedResponse<ExaminationPeriodItem>> {
    const response = await apiClient.get<PaginatedResponse<ExaminationPeriodItem>>('/examinations/periods/', { params });
    return response.data;
  },

  async createExaminationPeriod(payload: Record<string, unknown>): Promise<ExaminationPeriodItem> {
    const response = await apiClient.post<ExaminationPeriodItem>('/examinations/periods/', payload);
    return response.data;
  },

  // ── Examination Subjects & Schedules ──
  async getExamSubjects(params?: QueryParams): Promise<PaginatedResponse<ExaminationSubjectItem>> {
    const response = await apiClient.get<PaginatedResponse<ExaminationSubjectItem>>('/examinations/subjects/', { params });
    return response.data;
  },

  async createExamSubject(payload: Record<string, unknown>): Promise<ExaminationSubjectItem> {
    const response = await apiClient.post<ExaminationSubjectItem>('/examinations/subjects/', payload);
    return response.data;
  },

  async getExamSubjectCandidates(id: string): Promise<CandidatesResponse> {
    const response = await apiClient.get<CandidatesResponse>(`/examinations/subjects/${id}/candidates/`);
    return response.data;
  },

  async checkClashes(examinationId?: string): Promise<ClashCheckResponse> {
    const response = await apiClient.get<ClashCheckResponse>('/examinations/subjects/clashes/', {
      params: examinationId ? { examination_id: examinationId } : undefined
    });
    return response.data;
  },

  // ── Candidates Roll ──
  async getCandidates(params?: QueryParams): Promise<PaginatedResponse<CandidateItem>> {
    const response = await apiClient.get<PaginatedResponse<CandidateItem>>('/examinations/candidates/', { params });
    return response.data;
  },

  async updateCandidateStatus(payload: {
    candidate_ids: string[];
    eligibility_status?: string;
    fee_clearance?: string;
  }): Promise<{ success: boolean; updated_count: number; message: string }> {
    const response = await apiClient.post('/examinations/candidates/update_status/', payload);
    return response.data;
  },

  // ── Grade Scale ──
  async getGradeRules(params?: QueryParams): Promise<PaginatedResponse<GradeRule>> {
    const response = await apiClient.get<PaginatedResponse<GradeRule>>('/examinations/grades/', { params });
    return response.data;
  },

  async createGradeRule(payload: Record<string, unknown>): Promise<GradeRule> {
    const response = await apiClient.post<GradeRule>('/examinations/grades/', payload);
    return response.data;
  },
};
