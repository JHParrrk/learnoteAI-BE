import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-notes.dto';

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

  @Get(':id/analysis')
  async getAnalysis(@Param('id') id: string) {
    console.log('Received ID from request:', id); // 요청에서 받은 ID 확인
    const numericId = Number(id);
    console.log('Converted ID to number:', numericId); // 숫자로 변환된 ID 확인
    return this.notesService.getAnalysisResult(numericId);
  }
}
