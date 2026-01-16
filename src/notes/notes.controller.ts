import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { TodoResponseDto } from '../dashboard/dto/todo-response.dto';

@ApiTags('notes')
@ApiBearerAuth('access-token')
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

  @Get()
  @ApiOperation({ summary: 'List notes with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    type: NoteListResponseDto,
  })
  async listNotes(
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<NoteListResponseDto> {
    try {
      const userId = req.user.userId;
      const numericPage = page ? Number(page) : 1;
      const numericPageSize = pageSize ? Number(pageSize) : 5;

      if (isNaN(numericPage) || isNaN(numericPageSize)) {
        throw new BadRequestException(
          'Page and PageSize must be valid numbers',
        );
      }

      const notesList = await this.notesService.listNotes(
        userId,
        numericPage,
        numericPageSize,
      );
      return notesList;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to retrieve notes: ${errorMessage}`,
      );
    }
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
    return this.notesService.getAnalysisResult(numericId);
  }

  // =========================
  // 학습 TODO 저장
  // =========================
  @Post(':id/todos')
  @ApiOperation({
    summary: 'Save learning todos for a note',
    description:
      '노트 분석에서 제안된 할 일을 저장합니다. 이미 저장된 동일한 내용의 할 일은 제외되며, 저장 시 기본적으로 체크 상태(isChecked: true)로 설정됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: 'Todos saved successfully',
    type: [TodoResponseDto],
  })
  async saveTodos(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() saveTodosDto: SaveLearningTodosDto,
  ): Promise<TodoResponseDto[]> {
    const userId = req.user.userId;
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
