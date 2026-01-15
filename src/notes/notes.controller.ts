import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
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
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('notes')
@Controller('notes')
@UseGuards(AuthGuard('jwt')) // ✅ 노트 전체 JWT 보호 (핵심)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // =========================
  // 노트 생성
  // =========================
  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({
    status: 201,
    description: 'Note created successfully',
    type: NoteCreateResponseDto,
  })
  async createNote(
    @Req() req: RequestWithUser,
    @Body() createNoteDto: CreateNoteDto,
  ): Promise<{
    noteId: number;
    status: string;
    message: string;
    rawContent: string;
  }> {
    const userId = req.user.userId; // ✅ JWT에서 유저 ID
    return this.notesService.createNote(userId, createNoteDto);
  }

  // =========================
  // 노트 분석 결과 조회
  // =========================
  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get analysis result for a note' })
  @ApiResponse({
    status: 200,
    description: 'Analysis result retrieved',
    type: NoteAnalysisResponseDto,
  })
  async getAnalysis(@Param('id') id: string): Promise<NoteAnalysisResponse> {
    const numericId = Number(id);
    return this.notesService.getAnalysisResult(numericId);
  }

  // =========================
  // 학습 TODO 저장
  // =========================
  @Post(':id/todos')
  @ApiOperation({ summary: 'Save learning todos for a note' })
  @ApiResponse({
    status: 201,
    description: 'Todos saved successfully',
    type: SimpleMessageResponseDto,
  })
  async saveTodos(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() saveTodosDto: SaveLearningTodosDto,
  ): Promise<any> {
    const userId = req.user.userId; // ✅ 변경
    const numericId = Number(id);
    return this.notesService.saveLearningTodos(userId, numericId, saveTodosDto);
  }

  // =========================
  // 노트 수정
  // =========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({
    status: 200,
    description: 'Note updated successfully',
    type: NoteEntityDto,
  })
  async updateNote(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<NotesEntity> {
    const userId = req.user.userId; // ✅ 변경
    const numericId = Number(id);
    return this.notesService.updateNote(numericId, userId, updateNoteDto);
  }

  // =========================
  // 노트 삭제
  // =========================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({
    status: 200,
    description: 'Note deleted successfully',
    type: SimpleMessageResponseDto,
  })
  async deleteNote(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const userId = req.user.userId; // ✅ 변경
    const numericId = Number(id);
    return this.notesService.deleteNote(numericId, userId);
  }
}
