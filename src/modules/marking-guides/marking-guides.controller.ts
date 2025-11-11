import { Controller, Post, Get, Param, Body, UseGuards} from '@nestjs/common';
import { MarkingGuidesService } from './marking-guides.service';
import { CreateMarkingGuideDto } from './dto/create-marking-guide.dto';
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';


@Controller('marking-guides')
export class MarkingGuidesController {
  constructor(private readonly service: MarkingGuidesService) {}

 

@Post()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Create a new marking guide' })
async create(
  @Body() createDto: CreateMarkingGuideDto,
  @CurrentUser('id') userId: string, // Get the user ID from JWT
) {
  return this.service.create(createDto, userId);
}


  @Get('question/:questionId')
  async getByQuestionId(@Param('questionId') questionId: string) {
    return this.service.getByQuestionId(questionId);
  }
}
