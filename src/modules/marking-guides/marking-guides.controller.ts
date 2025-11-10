// import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
// import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// // import { MarkingGuidesService } from './marking-guides.service';
// // import { CreateMarkingGuideDto } from './dto/create-marking-guide.dto';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
// import { UserRole } from '../../shared/enums/user-role.enum';

// @ApiTags('marking-guides')
// @ApiBearerAuth()
// @UseGuards(RolesGuard)
// @Controller('marking-guides')
// export class MarkingGuidesController {
//   constructor(private readonly service: MarkingGuidesService) {}

//   @Post()
//   @Roles(UserRole.LECTURER, UserRole.ADMIN)
//   async create(
//     // @Body() createDto: CreateMarkingGuideDto,
//     @CurrentUser('id') userId: string,
//   ) {
//     // return this.service.create(createDto, userId);
//   }

//   @Get('question/:questionId')
//   @Roles(UserRole.LECTURER, UserRole.ADMIN)
//   async getByQuestionId(@Param('questionId') questionId: string) {
//     return this.service.getByQuestionId(questionId);
//   }
// }
