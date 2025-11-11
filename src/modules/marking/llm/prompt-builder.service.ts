import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilderService {
  buildMarkingPrompt(answer: any, guide: any): string {
    const keyPoints = Array.isArray(guide.key_points)
      ? guide.key_points
      : JSON.parse(guide.key_points);

    const evaluationCriteria =
      typeof guide.evaluation_criteria === 'string'
        ? JSON.parse(guide.evaluation_criteria)
        : guide.evaluation_criteria;

    return `You are marking a student answer. Evaluate against this marking guide.

## QUESTION
Maximum Marks: ${answer.max_marks}

## MODEL ANSWER
${guide.model_answer}

## KEY POINTS (Award marks for each)
${keyPoints
  .map(
    (kp: any, idx: number) =>
      `${idx + 1}. ${kp.point} (${kp.marks} marks)${kp.required ? ' [REQUIRED]' : ''}`,
  )
  .join('\n')}

## EVALUATION CRITERIA
- Content Accuracy (${guide.content_accuracy_weight * 100}%): ${evaluationCriteria.content_accuracy}
- Completeness (${guide.completeness_weight * 100}%): ${evaluationCriteria.completeness}
- Clarity (${guide.clarity_weight * 100}%): ${evaluationCriteria.clarity}
- Technical Correctness (${guide.technical_correctness_weight * 100}%): ${evaluationCriteria.technical_correctness}

## STUDENT ANSWER
${answer.answer_text}

## TASK
Respond with ONLY a JSON object (no markdown):
{
  "awarded_marks": <number 0-${answer.max_marks}>,
  "confidence_score": <0-1>,
  "content_accuracy_score": <number>,
  "completeness_score": <number>,
  "clarity_score": <number>,
  "technical_correctness_score": <number>,
  "feedback": "<constructive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "key_points_identified": [
    {"point": "<key point>", "found": true/false, "marks_awarded": <number>}
  ],
  "missing_points": ["<missing 1>", "<missing 2>"],
  "requires_human_review": true/false,
  "review_reason": "<reason or null>"
}`;
  }
}
