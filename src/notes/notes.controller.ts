import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  NoteListResponseDto,
  SimpleMessageResponseDto,
} from './dto/note-response.dto';

@ApiTags('notes')
@Controller('notes') // API prefix is usually global, set in main.ts
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async createNote(@Body() createNoteDto: CreateNoteDto) {
    // Assuming simple auth or no auth for now. Hardcoding userId = 1 for MVP.
    // In real app, get user from request context (Guard/Passport).
    const userId = 1;
    return this.notesService.createNote(userId, createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'List notes with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    type: NoteListResponseDto,
  })
  async listNotes(
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new BadRequestException('Invalid userId');
    }

    const numericPage = page ? Number(page) : 1;
    const numericPageSize = pageSize ? Number(pageSize) : 5;

    return this.notesService.listNotes(
      numericUserId,
      numericPage,
      numericPageSize,
    );
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
}
