// import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
// import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// // import { MarkingService } from './marking.service';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { UserRole } from '../../shared/enums/user-role.enum';

// @ApiTags('marking')
// @ApiBearerAuth()
// @UseGuards(RolesGuard)
// @Controller('marking')
// export class MarkingController {
//   constructor(private readonly service: MarkingService) {}

//   @Post('test')
//   @Roles(UserRole.LECTURER, UserRole.ADMIN)
//   async testMarking(@Body() body: { answerId: string; guideId: string }) {
//     const testGuide = {
//       id: body.guideId,
//       model_answer: 'Test model answer',
//       key_points: [{ point: 'Test point', marks: 5, required: true }],
//       evaluation_criteria: {
//         content_accuracy: 'Test',
//         completeness: 'Test',
//         clarity: 'Test',
//         technical_correctness: 'Test',
//       },
//       content_accuracy_weight: 0.4,
//       completeness_weight: 0.3,
//       clarity_weight: 0.15,
//       technical_correctness_weight: 0.15,
//     };

//     return this.service.markSingleAnswer(body.answerId, testGuide);
//   }

//   @Get('result/:attemptId')
//   @Roles(UserRole.LECTURER, UserRole.ADMIN, UserRole.STUDENT)
//   async getResults(@Param('attemptId') attemptId: string) {
//     return this.service.getMarkingResults(attemptId);
//   }
// }
