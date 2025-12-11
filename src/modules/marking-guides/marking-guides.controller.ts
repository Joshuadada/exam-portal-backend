import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MarkingGuidesService } from './marking-guides.service';
import { CreateMarkingGuideDto } from './dto/create-marking-guide.dto';
import { UpdateMarkingGuideDto } from './dto/update-marking-guide.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';

@ApiTags('marking-guides')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('marking-guides')
export class MarkingGuidesController {
  constructor(private readonly markingGuidesService: MarkingGuidesService) {}

  @Post()
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new marking guide' })
  @ApiResponse({
    status: 201,
    description: 'Marking guide created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid data or guide exists' })
  async create(
    @Body() createDto: CreateMarkingGuideDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.markingGuidesService.create(createDto, userId);
  }

  @Get()
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all marking guides with filters' })
  @ApiQuery({ name: 'question_id', required: false })
  @ApiQuery({ name: 'exam_id', required: false })
  async findAll(
    @Query('question_id') questionId?: string,
    @Query('exam_id') examId?: string,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') userRole?: UserRole,
  ) {
    return this.markingGuidesService.findAll(
      { question_id: questionId, exam_id: examId },
      userId,
      userRole,
    );
  }

  @Get('question/:questionId')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get active marking guide for a question' })
  @ApiResponse({ status: 200, description: 'Marking guide found' })
  @ApiResponse({ status: 404, description: 'No marking guide found' })
  async getByQuestionId(@Param('questionId') questionId: string) {
    return this.markingGuidesService.findByQuestionId(questionId);
  }

  @Get('question/:questionId/versions')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all versions of marking guide for a question' })
  async getAllVersions(@Param('questionId') questionId: string) {
    return this.markingGuidesService.findAllVersionsByQuestionId(questionId);
  }

  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get marking guide by ID' })
  async findOne(@Param('id') id: string) {
    return this.markingGuidesService.findById(id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get usage statistics for marking guide' })
  async getStatistics(@Param('id') id: string) {
    return this.markingGuidesService.getStatistics(id);
  }

  @Put(':id')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update marking guide' })
  @ApiResponse({ status: 200, description: 'Marking guide updated' })
  @ApiResponse({ status: 403, description: 'Not authorized to update' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMarkingGuideDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.markingGuidesService.update(id, updateDto, userId, userRole);
  }

  @Delete(':id')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete (deactivate) marking guide' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.markingGuidesService.remove(id, userId, userRole);
  }

  @Post('question/:questionId/version')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new version of marking guide' })
  @ApiResponse({ status: 201, description: 'New version created' })
  async createVersion(
    @Param('questionId') questionId: string,
    @Body() createDto: CreateMarkingGuideDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.markingGuidesService.createNewVersion(
      questionId,
      createDto,
      userId,
    );
  }

  @Post(':id/validate')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Validate marking guide structure' })
  async validate(@Param('id') id: string) {
    const guide = await this.markingGuidesService.findById(id);
    return this.markingGuidesService.validateGuide(guide);
  }
}