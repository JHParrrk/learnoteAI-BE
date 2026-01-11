import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async analyzeNote(rawContent: string): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI API Key not found');
    }

    const systemPrompt = `당신은 시니어 개발자 멘토이며, 사용자가 작성한 비정제 노트를 읽고 다음을 수행해야 합니다:
1. 노트의 내용을 가장 잘 나타내는 제목 생성 (generatedTitle)
2. 학습 내용을 Markdown 포맷으로 정리 (refinedContent)
3. 기술적으로 잘못된 부분을 검증 (factChecks)
4. 사용자의 기술 수준을 반영한 피드백 제공 (feedback)
5. Actionable Todo를 제안하여 발전 방향을 제시 (suggestedTodos)
6. 스킬 트리 업데이트 제안 (666)

Return JSON only.
Structure:
{
  "generatedTitle": "string",
  "refinedNote": "markdown string",
  "summary": { "keywords": [], "oneLineSummary": "" },
  "factChecks": [{ "originalText": "", "verdict": "TRUE|FALSE|PARTIALLY_TRUE", "comment": "", "correction": "" }],
  "feedback": { "type": "GOOD|BAD", "message": "", "longTermGoal": "", "shortTermGoal": "" },
  "skillUpdateProposal": { "category": "", "stack": "", "newSkills": [] },
  "suggestedTodos": [{ "content": "", "deadlineType": "SHORT_TERM|LONG_TERM", "reason": "" }]
}`;

    const completion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawContent },
      ],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (content === null) {
      throw new Error('Content is null and cannot be parsed');
    }
    return JSON.parse(content);
  }
}
