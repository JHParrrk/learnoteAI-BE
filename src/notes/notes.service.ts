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

  async listNotes(
    userId: number,
    page = 1,
    pageSize = 5,
  ): Promise<{
    items: Pick<NotesEntity, 'id' | 'title' | 'created_at'>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    if (!Number.isFinite(page) || page < 1) {
      throw new BadRequestException('page must be a positive number');
    }

    if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 50) {
      throw new BadRequestException('pageSize must be between 1 and 50');
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const response = await this.supabase
      .from(TABLE_NOTES)
      .select('id,title,created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (response.error) {
      this.logger.error('Failed to list notes', response.error);
      throw new InternalServerErrorException('Failed to list notes');
    }

    return {
      items: (
        (response.data as Pick<NotesEntity, 'id' | 'title' | 'created_at'>[]) ??
        []
      ).map((item) => ({
        ...item,
        created_at: item.created_at
          ? item.created_at.toString().slice(0, 10)
          : item.created_at,
      })),
      total: response.count ?? 0,
      page,
      pageSize,
    };
  }

  async updateNote(
    id: number,
    userId: number,
    updateNoteDto: UpdateNoteDto,
  ): Promise<NotesEntity> {
    const { title, refinedContent } = updateNoteDto;
    const updates: Partial<NotesEntity> = {};
    if (title !== undefined) updates.title = title;
    if (refinedContent !== undefined) updates.refined_content = refinedContent;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No fields to update provided.');
    }

    const response = (await this.supabase
      .from(TABLE_NOTES)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()) as unknown as {
      data: NotesEntity | null;
      error: { message: string } | null;
    };

    if (response.error) {
      this.logger.error(`Failed to update note ID: ${id}`, response.error);
      throw new InternalServerErrorException('Failed to update note.');
    }
    if (!response.data) {
      throw new NotFoundException(
        `Note with ID ${id} not found for this user.`,
      );
    }

    return response.data;
  }

  async deleteNote(id: number, userId: number): Promise<{ message: string }> {
    const { error: noteError } = await this.supabase
      .from(TABLE_NOTES)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (noteError) {
      this.logger.error(`Failed to delete note ID: ${id}`, noteError);
      throw new InternalServerErrorException('Failed to delete note.');
    }

    return { message: 'Note and associated analysis deleted successfully' };
  }

  async saveLearningTodos(
    userId: number,
    noteId: number,
    saveDto: SaveLearningTodosDto,
  ): Promise<any[]> {
    // Optional: Verify note exists and belongs to user
    const { data: note, error: noteError } = await this.supabase
      .from(TABLE_NOTES)
      .select('id')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (noteError || !note) {
      throw new NotFoundException(
        `Note with ID ${noteId} not found or unauthorized`,
      );
    }

    if (!saveDto.todos || saveDto.todos.length === 0) {
      return [];
    }

    const todosToInsert = saveDto.todos.map((todo) => ({
      note_id: noteId,
      user_id: userId,
      content: todo.content,
      reason: todo.reason,
      due_date: todo.dueDate,
      deadline_type: todo.deadlineType as DeadlineType,
      status: 'PENDING',
    }));

    const { data, error } = await this.supabase
      .from(TABLE_LEARNING_TODOS)
      .insert(todosToInsert)
      .select();

    if (error) {
      this.logger.error(`Failed to save learning todos: ${error.message}`);
      throw new InternalServerErrorException('Failed to save learning todos');
    }

    return data;
  }
}
