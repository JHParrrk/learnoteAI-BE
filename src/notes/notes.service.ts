import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenaiService } from '../openai/openai.service';
import { CreateNoteDto } from './dto/create-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SaveLearningTodosDto } from './dto/save-learning-todos.dto';
import { OpenAIAnalysisResult } from './interfaces/openai-analysis-result.interface';
import { NotesEntity } from './interfaces/notes-entity.interface';
import { AnalysisEntity } from './interfaces/analysis-entity.interface';
import { NoteAnalysisResponse } from './interfaces/note-analysis-response.interface';
import { DeadlineType } from '../dashboard/interfaces/deadline-type.enum';

const TABLE_NOTES = 'notes';
const TABLE_NOTES_ANALYSIS = 'notes_analysis';
const TABLE_LEARNING_TODOS = 'learning_todos';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly openaiService: OpenaiService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async createNote(
    userId: number,
    createNoteDto: CreateNoteDto,
  ): Promise<{
    noteId: number;
    status: string;
    message: string;
    rawContent: string;
  }> {
    if (!createNoteDto?.rawContent) {
      throw new BadRequestException(
        'Invalid note data: rawContent is required.',
      );
    }

    const isAutoTitle = !createNoteDto.title;
    const titleToSave = createNoteDto.title || 'Untitled Note';

    const response = (await this.supabase
      .from(TABLE_NOTES)
      .insert({
        user_id: userId,
        title: titleToSave,
        raw_content: createNoteDto.rawContent,
      })
      .select()
      .single()) as unknown as {
      data: NotesEntity | null;
      error: { message: string } | null;
    };

    if (response.error || !response.data) {
      this.logger.error('Failed to save Note', response.error);
      throw new InternalServerErrorException(
        `Failed to save Note: ${response.error?.message || 'Unknown error'}`,
      );
    }

    const note = response.data;

    this.analyzeNotes(note.id, createNoteDto.rawContent, isAutoTitle).catch(
      (err) => {
        this.logger.error(`Error analyzing note ID: ${note.id}`, err);
      },
    );

    return {
      noteId: note.id,
      status: 'ANALYZING',
      message: '노트가 저장되었으며, AI 분석이 시작되었습니다.',
      rawContent: note.raw_content,
    };
  }

  async analyzeNotes(
    noteId: number,
    rawContent: string,
    updateTitle = false,
  ): Promise<void> {
    try {
      const result = (await this.openaiService.analyzeNote(
        rawContent,
      )) as unknown;

      if (!result || typeof result !== 'object' || !('refinedNote' in result)) {
        throw new InternalServerErrorException(
          'Invalid analysis result from OpenAI service',
        );
      }

      const analysisResult = result as OpenAIAnalysisResult;

      const { error: insertError } = (await this.supabase
        .from(TABLE_NOTES_ANALYSIS)
        .insert({
          note_id: noteId,
          summary_json: analysisResult.summary,
          skill_proposal_json: analysisResult.skillUpdateProposal,
          feedback_json: analysisResult.feedback,
          suggested_todos_json: analysisResult.suggestedTodos,
          fact_checks_json: analysisResult.factChecks || [],
        })) as unknown as { error: { message: string } | null };

      if (insertError) {
        this.logger.error(
          `Failed to save analysis for note ID: ${noteId}`,
          insertError,
        );
        return;
      }

      const updateData: { refined_content: string; title?: string } = {
        refined_content: analysisResult.refinedNote,
      };

      if (updateTitle && analysisResult.generatedTitle) {
        updateData.title = analysisResult.generatedTitle;
      }

      const { error: updateError } = (await this.supabase
        .from(TABLE_NOTES)
        .update(updateData)
        .eq('id', noteId)) as unknown as { error: { message: string } | null };

      if (updateError) {
        this.logger.error(
          `Failed to update note with refined content for note ID: ${noteId}`,
          updateError,
        );
      }
    } catch (error) {
      this.logger.error(`Analysis failed for note ID: ${noteId}`, error);
    }
  }

  async getAnalysisResult(noteId: number): Promise<NoteAnalysisResponse> {
    const noteResponse = (await this.supabase
      .from(TABLE_NOTES)
      .select('*')
      .eq('id', noteId)
      .single()) as unknown as {
      data: NotesEntity | null;
      error: { message: string } | null;
    };

    if (noteResponse.error || !noteResponse.data) {
      throw new NotFoundException(`Note with ID ${noteId} not found.`);
    }
    const note = noteResponse.data;

    const analysisResponse = (await this.supabase
      .from(TABLE_NOTES_ANALYSIS)
      .select('*')
      .eq('note_id', noteId)
      .single()) as unknown as {
      data: AnalysisEntity | null;
      error: { message: string } | null;
    };

    if (analysisResponse.error || !analysisResponse.data) {
      return {
        noteId,
        title: note.title,
        status: 'ANALYZING',
        rawContent: note.raw_content || null,
        message: 'Analysis is still in progress.',
      };
    }

    const analysis = analysisResponse.data;

    return {
      noteId,
      title: note.title,
      status: 'COMPLETED',
      rawContent: note.raw_content || null,
      refinedNote: note.refined_content || null,
      summary: analysis.summary_json,
      factChecks: analysis.fact_checks_json || [],
      feedback: analysis.feedback_json,
      skillUpdateProposal: analysis.skill_proposal_json,
      suggestedTodos: analysis.suggested_todos_json,
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
