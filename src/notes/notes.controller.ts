import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SaveLearningTodosDto } from './dto/save-learning-todos.dto';
import { NotesEntity } from './interfaces/notes-entity.interface';
import { NoteAnalysisResponse } from './interfaces/note-analysis-response.interface';
import {
  NoteAnalysisResponseDto,
  NoteCreateResponseDto,
  NoteEntityDto,
  SimpleMessageResponseDto,
} from './dto/note-response.dto';

@ApiTags('notes')
@Controller('notes') // API prefix is usually global, set in main.ts
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({
    status: 201,
    description: 'Note created successfully',
    type: NoteCreateResponseDto,
  })
  async createNote(@Body() createNoteDto: CreateNoteDto): Promise<{
    noteId: number;
    status: string;
    message: string;
    rawContent: string;
  }> {
    // Assuming simple auth or no auth for now. Hardcoding userId = 1 for MVP.
    // In real app, get user from request context (Guard/Passport).
    const userId = 1;
    return this.notesService.createNote(userId, createNoteDto);
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get analysis result for a note' })
  @ApiResponse({
    status: 200,
    description: 'Analysis result retrieved',
    type: NoteAnalysisResponseDto,
  })
  async getAnalysis(@Param('id') id: string): Promise<NoteAnalysisResponse> {
    console.log('Received ID from request:', id); // 요청에서 받은 ID 확인
    const numericId = Number(id);
    console.log('Converted ID to number:', numericId); // 숫자로 변환된 ID 확인
    return this.notesService.getAnalysisResult(numericId);
  }

  @Post(':id/todos')
  @ApiOperation({ summary: 'Save learning todos for a note' })
  @ApiResponse({
    status: 201,
    description: 'Todos saved successfully',
    type: SimpleMessageResponseDto,
  })
  async saveTodos(
    @Param('id') id: string,
    @Body() saveTodosDto: SaveLearningTodosDto,
  ): Promise<any> {
    const userId = 1;
    const numericId = Number(id);
    return this.notesService.saveLearningTodos(userId, numericId, saveTodosDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({
    status: 200,
    description: 'Note updated successfully',
    type: NoteEntityDto,
  })
  async updateNote(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<NotesEntity> {
    const userId = 1;
    const numericId = Number(id);
    return this.notesService.updateNote(numericId, userId, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({
    status: 200,
    description: 'Note deleted successfully',
    type: SimpleMessageResponseDto,
  })
  async deleteNote(@Param('id') id: string): Promise<{ message: string }> {
    const userId = 1;
    const numericId = Number(id);
    return this.notesService.deleteNote(numericId, userId);
  }
}
