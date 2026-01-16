import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenaiService } from '../openai/openai.service';
import { DeadlineType } from '../dashboard/interfaces/deadline-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('NotesService', () => {
  let service: NotesService;
  let supabaseService: SupabaseService;
  let openaiService: OpenaiService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue(mockSupabaseClient),
  };

  const mockOpenaiService = {
    analyzeNote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: OpenaiService, useValue: mockOpenaiService },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    openaiService = module.get<OpenaiService>(OpenaiService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveLearningTodos', () => {
    const userId = 1;
    const noteId = 100;
    const saveDto = {
      todos: [
        {
          content: 'Todo 1',
          reason: 'Reason 1',
          dueDate: '2026-01-20',
          deadlineType: DeadlineType.SHORT_TERM,
        },
        {
          content: 'Todo 2',
          reason: 'Reason 2',
          dueDate: '2026-01-25',
          deadlineType: null, // Test nullable
        },
      ],
    };

    it('should save new todos and ignore existing ones with correct properties', async () => {
      // 1. Mock note check (from('notes').select(...).eq(...).single())
      const noteQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: { id: noteId }, error: null }),
      };

      // 2. Mock existing todos check (from('learning_todos').select('content')...)
      // existingTodos returns Todo 1, so Todo 1 should be filtered out.
      const existingTodosQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) =>
          resolve({ data: [{ content: 'Todo 1' }], error: null }),
        ),
      };

      // 3. Mock insert newly created todos (Todo 2)
      // Expect insert to be called with Todo 2 details (is_checked: true, deadline_type: null)
      const insertQuery = {
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 2,
              note_id: noteId,
              user_id: userId,
              content: 'Todo 2',
              due_date: '2026-01-25',
              status: 'PENDING',
              reason: 'Reason 2',
              deadline_type: null,
              created_at: '2026-01-17T00:00:00Z',
              is_checked: true,
            },
          ],
          error: null,
        }),
      };

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'notes') return noteQuery;
        if (table === 'learning_todos') {
          const builder: any = {};
          // If select is called first, it's the check
          builder.select = jest.fn().mockImplementation((cols) => {
            if (cols === 'content') return existingTodosQuery;
            return builder;
          });

          builder.eq = jest.fn().mockReturnThis();

          // If insert is called, it's the save
          builder.insert = jest.fn().mockImplementation((payload) => {
            // Verify payload here if we want strictly
            return insertQuery;
          });

          return builder;
        }
        return mockSupabaseClient;
      });

      const result = await service.saveLearningTodos(userId, noteId, saveDto);

      expect(result).toHaveLength(1); // Only Todo 2
      expect(result[0].content).toBe('Todo 2');
      expect(result[0].isChecked).toBe(true); // Check logic
      expect(result[0].deadlineType).toBeNull(); // Check null handling
    });
  });
});
