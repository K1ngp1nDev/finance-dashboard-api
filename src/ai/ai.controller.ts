import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AiService } from './ai.service'

class AiQueryDto {
  @ApiProperty({ example: 'How much did I spend on food this month?' })
  @IsString()
  question: string
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private service: AiService) {}

  @Post('query')
  @ApiOperation({ summary: 'Ask an AI question about your finances' })
  async query(@Request() req, @Body() dto: AiQueryDto) {
    if (!dto.question) throw new BadRequestException('question is required')
    const answer = await this.service.query(req.user.id, dto.question)
    return { answer }
  }
}
