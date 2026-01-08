export interface AnalysisEntity {
  summary_json: Record<string, any>;
  feedback_json: Record<string, any>;
  skill_proposal_json: Record<string, any>;
  suggested_todos_json: any[];
  fact_checks_json: any[];
}
