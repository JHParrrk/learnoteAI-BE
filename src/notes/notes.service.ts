import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenaiService } from '../openai/openai.service';
import { CreateNoteDto } from './dto/create-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { OpenAIAnalysisResult } from './interfaces/openai-analysis-result.interface';
import { NotesEntity } from './interfaces/notes-entity.interface';
import { AnalysisEntity } from './interfaces/analysis-entity.interface';
import { NoteAnalysisResponse } from './interfaces/note-analysis-response.interface';

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
  async createNote(
    userId: number,
    createNoteDto: CreateNoteDto,
  ): Promise<{ noteId: number; status: string; message: string }> {
    if (!createNoteDto || typeof createNoteDto.rawContent !== 'string') {
      throw new Error('Invalid note data');
    }

    const isAutoTitle = !createNoteDto.title;
    const titleToSave = createNoteDto.title || 'Untitled Note';

    // 1. Save raw Note
    const response = (await this.supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: titleToSave,
        raw_content: createNoteDto.rawContent,
      })
      .select()
      .single()) as {
      data: NotesEntity | null;
      error: { message: string } | null;
    };

    if (response.error || !response.data) {
      throw new Error(
        `Failed to save Note: ${response.error?.message || 'Unknown error'}`,
      );
    }

    const note = response.data;

    // 2. Trigger AI Analysis asynchronously
    this.analyzeNotes(note.id, createNoteDto.rawContent, isAutoTitle).catch(
      (err: unknown) => {
        console.error('Error analyzing note:', err);
      },
    );

    return {
      noteId: note.id,
      status: 'ANALYZING',
      message: '노트가 저장되었으며, AI 분석이 시작되었습니다.',
    };
  }

  async analyzeNotes(
    noteId: number,
    rawContent: string,
    updateTitle: boolean = false,
  ) {
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

    // Prepare update data
    const updateData: { refined_content: string; title?: string } = {
      refined_content: analysisResult.refinedNote,
    };

    if (updateTitle && analysisResult.generatedTitle) {
      updateData.title = analysisResult.generatedTitle;
    }

    // Save Refined Note (and optionally title)
    await this.supabase.from('notes').update(updateData).eq('id', noteId);
  }

  async getAnalysisResult(noteId: number): Promise<NoteAnalysisResponse> {
    const noteResponse = (await this.supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()) as {
      data: NotesEntity | null;
      error: { message: string } | null;
    };

    if (noteResponse.error || !noteResponse.data) {
      throw new NotFoundException('Note not found');
    }
    const note = noteResponse.data;

    const analysisResponse = (await this.supabase
      .from('notes_analysis')
      .select('*')
      .eq('note_id', noteId)
      .single()) as {
      data: AnalysisEntity | null;
      error: { message: string } | null;
    };

    const analysis = analysisResponse.data;

    if (!analysis) {
      return {
        noteId,
        title: note.title,
        status: 'ANALYZING',
        message: 'Analysis is still in progress.',
      };
    }

    return {
      noteId,
      title: note.title,
      status: 'COMPLETED',
      refinedNote: note?.refined_content || null,
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

    const response = (await this.supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()) as {
      data: NotesEntity | null;
      error: { message: string } | null;
    };

    if (response.error || !response.data) {
      throw new Error(
        `Failed to update note: ${response.error?.message || 'Unknown error'}`,
      );
    }

    return response.data;
  }

  async deleteNote(id: number, userId: number): Promise<{ message: string }> {
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete note: ${error.message}`);
    }

    return { message: 'Note deleted successfully' };
  }
}
