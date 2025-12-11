import { Injectable } from '@nestjs/common';

export interface KeyPoint {
  point: string;
  marks: number;
  required: boolean;
  keywords?: string[];
}

export interface MarkingGuide {
  id: string;
  question_id: string;
  model_answer: string;
  key_points: KeyPoint[];
  marking_rubric: any;
  evaluation_criteria: any;
  content_accuracy_weight: number;
  completeness_weight: number;
  clarity_weight: number;
  technical_correctness_weight: number;
  common_mistakes: any[];
  partial_credit_rules: any[];
  keywords: string[];
}

export interface StudentAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  max_marks: number;
}

@Injectable()
export class PromptBuilderService {
  buildMarkingPrompt(answer: StudentAnswer, guide: MarkingGuide): string {
    const keyPoints = Array.isArray(guide.key_points)
      ? guide.key_points
      : JSON.parse(guide.key_points as any);

    const evaluationCriteria =
      typeof guide.evaluation_criteria === 'string'
        ? JSON.parse(guide.evaluation_criteria)
        : guide.evaluation_criteria;

    const markingRubric =
      typeof guide.marking_rubric === 'string'
        ? JSON.parse(guide.marking_rubric)
        : guide.marking_rubric;

    const commonMistakes = Array.isArray(guide.common_mistakes)
      ? guide.common_mistakes
      : JSON.parse(guide.common_mistakes as any);

    const partialCreditRules = Array.isArray(guide.partial_credit_rules)
      ? guide.partial_credit_rules
      : JSON.parse(guide.partial_credit_rules as any);

    return `You are an expert academic marker. Evaluate the following student answer against the marking guide.

## QUESTION CONTEXT
Maximum Marks: ${answer.max_marks}

## MARKING GUIDE

### Model Answer:
${guide.model_answer}

### Key Points to Award Marks:
${keyPoints
  .map(
    (kp: KeyPoint, idx: number) =>
      `${idx + 1}. ${kp.point} (${kp.marks} marks)${kp.required ? ' [REQUIRED]' : ''}${
        kp.keywords ? `\n   Keywords: ${kp.keywords.join(', ')}` : ''
      }`,
  )
  .join('\n')}

### Evaluation Criteria:
- Content Accuracy (${guide.content_accuracy_weight * 100}%): ${evaluationCriteria.content_accuracy}
- Completeness (${guide.completeness_weight * 100}%): ${evaluationCriteria.completeness}
- Clarity (${guide.clarity_weight * 100}%): ${evaluationCriteria.clarity}
- Technical Correctness (${guide.technical_correctness_weight * 100}%): ${evaluationCriteria.technical_correctness}

### Marking Rubric:
${this.formatRubric(markingRubric)}

### Common Mistakes (Apply Deductions):
${commonMistakes.map((m: any) => `- ${m.mistake}: -${m.deduction} marks`).join('\n')}

### Partial Credit Rules:
${partialCreditRules.map((r: any) => `- ${r.condition}: ${r.credit_percentage}% credit`).join('\n')}

### Important Keywords to Look For:
${guide.keywords.join(', ')}

## STUDENT ANSWER:
${answer.answer_text}

## YOUR TASK:
Evaluate this answer and respond ONLY with a JSON object (no markdown backticks, no preamble) with this exact structure:

{
  "awarded_marks": <number between 0 and ${answer.max_marks}>,
  "confidence_score": <number between 0 and 1>,
  "content_accuracy_score": <number>,
  "completeness_score": <number>,
  "clarity_score": <number>,
  "technical_correctness_score": <number>,
  "feedback": "<detailed constructive feedback for the student>",
  "strengths": ["<strength 1>", "<strength 2>", "..."],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "..."],
  "key_points_identified": [
    {"point": "<key point from guide>", "found": true/false, "marks_awarded": <number>}
  ],
  "missing_points": ["<missing point 1>", "<missing point 2>", "..."],
  "requires_human_review": true/false,
  "review_reason": "<reason if flagged, otherwise null>"
}

## MARKING INSTRUCTIONS:
1. Carefully compare the student answer with the model answer and key points
2. Award marks for each key point demonstrated (can be implicit or explicit understanding)
3. Look for keywords but also recognize equivalent expressions and concepts
4. Apply deductions for common mistakes found
5. Consider partial credit rules where applicable
6. Provide specific, actionable feedback that helps the student improve
7. Identify concrete strengths and weaknesses
8. Flag for human review if:
   - Confidence score < 0.7
   - Answer is ambiguous or requires expert interpretation
   - Score is borderline (within 10% of key thresholds like 50%, 60%, 70%)
   - Technical content requires domain expert verification
   - Answer quality is exceptional (>95%) or extremely poor (<20%)
9. Be fair but rigorous in assessment
10. Total awarded marks MUST NOT exceed ${answer.max_marks}

CRITICAL: Respond with ONLY the JSON object, no other text.`;
  }

  private formatRubric(rubric: any): string {
    return Object.entries(rubric)
      .map(([level, criteria]: [string, any]) => {
        return `**${level.toUpperCase()}** (${criteria.range[0]}-${criteria.range[1]} marks): ${criteria.criteria}`;
      })
      .join('\n');
  }
}
