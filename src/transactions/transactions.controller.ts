import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { TransactionsService } from './transactions.service'
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFiltersDto,
} from './dto/transaction.dto'

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private service: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions with optional filters' })
  findAll(@Request() req, @Query() filters: TransactionFiltersDto) {
    return this.service.findAll(req.user.id, filters)
  }

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  create(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.service.create(req.user.id, dto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.service.update(req.user.id, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id)
  }

  @Post('categorize')
  @ApiOperation({ summary: 'AI-categorize a description' })
  categorize(@Body('description') description: string) {
    if (!description) throw new BadRequestException('description is required')
    return this.service.categorize(description).then((category) => ({ category }))
  }

  @Post('import')
  @ApiOperation({ summary: 'Import transactions from CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('CSV file is required')
    const text = file.buffer.toString('utf-8')
    return this.service.importCsv(req.user.id, text)
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Spending totals by category and month' })
  getSummary(@Request() req) {
    return this.service.getAnalyticsSummary(req.user.id)
  }
}
