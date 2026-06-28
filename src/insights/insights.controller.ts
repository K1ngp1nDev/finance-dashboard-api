import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { InsightsService } from './insights.service'

@ApiTags('insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private service: InsightsService) {}

  @Get('budgets')
  @ApiOperation({ summary: 'Budget targets vs average monthly spend per category' })
  budgets(@Request() req) {
    return this.service.budgets(req.user.id)
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Recurring subscription payments detected from transactions' })
  subscriptions(@Request() req) {
    return this.service.subscriptions(req.user.id)
  }

  @Get('goals')
  @ApiOperation({ summary: 'Savings goals with progress and forecast' })
  goals(@Request() req) {
    return this.service.goals(req.user.id)
  }

  @Get('categories')
  @ApiOperation({ summary: 'Category stats and demo categorization rules' })
  categories(@Request() req) {
    return this.service.categories(req.user.id)
  }
}
