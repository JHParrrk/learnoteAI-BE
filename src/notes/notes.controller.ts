import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesEntity } from './interfaces/notes-entity.interface';
import { NoteAnalysisResponse } from './interfaces/note-analysis-response.interface';

@Controller('notes') // API prefix is usually global, set in main.ts
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async createNote(
    @Body() createNoteDto: CreateNoteDto,
  ): Promise<{ noteId: number; status: string; message: string }> {
    // Assuming simple auth or no auth for now. Hardcoding userId = 1 for MVP.
    // In real app, get user from request context (Guard/Passport).
    const userId = 1;
    return this.notesService.createNote(userId, createNoteDto);
  }

  @Get(':id/analysis')
  async getAnalysis(@Param('id') id: string): Promise<NoteAnalysisResponse> {
    console.log('Received ID from request:', id); // 요청에서 받은 ID 확인
    const numericId = Number(id);
    console.log('Converted ID to number:', numericId); // 숫자로 변환된 ID 확인
    return this.notesService.getAnalysisResult(numericId);
  }

  @Patch(':id')
  async updateNote(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<NotesEntity> {
    const userId = 1;
    const numericId = Number(id);
    return this.notesService.updateNote(numericId, userId, updateNoteDto);
  }

  @Delete(':id')
  async deleteNote(@Param('id') id: string): Promise<{ message: string }> {
    const userId = 1;
    const numericId = Number(id);
    return this.notesService.deleteNote(numericId, userId);
  }
}
