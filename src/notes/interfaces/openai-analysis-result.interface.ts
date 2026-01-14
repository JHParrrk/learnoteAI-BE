export interface OpenAIAnalysisResult {
  generatedTitle?: string;
  refinedNote: string;
  summary: Record<string, any>;
  factChecks: Array<{
    originalText: string;
    verdict: string;
    comment?: string;
    correction?: string;
  }>;
  feedback: Record<string, any>;
  skillUpdateProposal: Record<string, any>;
  suggestedTodos: any[];
}
