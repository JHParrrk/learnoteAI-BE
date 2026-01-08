import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { OpenaiModule } from '../openai/openai.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [OpenaiModule, SupabaseModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
