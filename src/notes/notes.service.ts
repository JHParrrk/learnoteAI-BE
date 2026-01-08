import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenaiService } from '../openai/openai.service';
import { CreateNoteDto } from './dto/create-notes.dto';
import { OpenAIAnalysisResult } from './interfaces/openai-analysis-result.interface';
import { NotesEntity } from './interfaces/notes-entity.interface';
import { AnalysisEntity } from './interfaces/analysis-entity.interface';

@Injectable()
export class NotesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly openaiService: OpenaiService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  // Fixing type issues and unsafe assignments
  async createNote(userId: number, createNoteDto: CreateNoteDto) {
    if (createNoteDto && typeof createNoteDto === 'object') {
      if (
        typeof createNoteDto.title === 'string' &&
        typeof createNoteDto.rawContent === 'string'
      ) {
        // 1. Save raw review
        const response = (await this.supabase
          .from('notes')
          .insert({
            user_id: userId,
            title: createNoteDto.title,
            raw_content: createNoteDto.rawContent,
          })
          .select()
          .single()) as {
          data: NotesEntity | null;
          error: { message: string } | null;
        };

        if (response.error || !response.data) {
          throw new Error(
            `Failed to save review: ${response.error?.message || 'Unknown error'}`,
          );
        }

        const review = response.data;

        // 2. Trigger AI Analysis asynchronously
        this.analyzeNotes(review.id, createNoteDto.rawContent).catch(
          (err: unknown) => {
            console.error('Error analyzing review:', err);
          },
        );

        return {
          reviewId: review.id,
          status: 'ANALYZING',
          message: '노트가 저장되었으며, AI 분석이 시작되었습니다.',
        };
      }
    }
  }

  async analyzeNotes(noteId: number, rawContent: string) {
    // Call OpenAI
    const result = (await this.openaiService.analyzeNote(
      rawContent,
    )) as unknown;

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid analysis result from OpenAI service');
    }

    const analysisResult = result as OpenAIAnalysisResult;

    // Save Analysis Result
    const insertResponse = (await this.supabase.from('notes_analysis').insert({
      note_id: noteId,
      summary_json: analysisResult.summary,
      skill_proposal_json: analysisResult.skillUpdateProposal,
      feedback_json: analysisResult.feedback,
      suggested_todos_json: analysisResult.suggestedTodos,
      fact_checks_json: analysisResult.factChecks || [],
    })) as { error: { message: string } | null };

    if (insertResponse.error) {
      console.error('Failed to save analysis', insertResponse.error);
      return;
    }

    // Save Refined Note
    await this.supabase
      .from('notes')
      .update({ refined_content: analysisResult.refinedNote })
      .eq('id', noteId);
  }

  async getAnalysisResult(reviewId: number) {
    const reviewResponse = (await this.supabase
      .from('notes')
      .select('*')
      .eq('id', reviewId)
      .single()) as {
      data: NotesEntity | null;
      error: { message: string } | null;
    };

    if (reviewResponse.error || !reviewResponse.data) {
      throw new NotFoundException('Review not found');
    }
    const review = reviewResponse.data;

    const analysisResponse = (await this.supabase
      .from('notes_analysis')
      .select('*')
      .eq('note_id', reviewId)
      .single()) as {
      data: AnalysisEntity | null;
      error: { message: string } | null;
    };

    const analysis = analysisResponse.data;

    if (!analysis) {
      return {
        reviewId,
        status: 'ANALYZING',
        message: 'Analysis is still in progress.',
      };
    }

    return {
      reviewId,
      status: 'COMPLETED',
      refinedNote: review?.refined_content || null,
      summary: analysis.summary_json,
      factChecks: analysis.fact_checks_json || [],
      feedback: analysis.feedback_json,
      skillUpdateProposal: analysis.skill_proposal_json,
      suggestedTodos: analysis.suggested_todos_json,
    };
  }
}
