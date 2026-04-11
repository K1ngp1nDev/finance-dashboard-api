import { Injectable } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AiService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  constructor(private prisma: PrismaService) {}

  async query(userId: string, question: string): Promise<string> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      orderBy: { date: 'desc' },
      take: 200,
    })

    const summary = transactions
      .map((t) => `${t.date.toISOString().split('T')[0]} | ${t.category} | ${t.description} | $${t.amount.toFixed(2)}`)
      .join('\n')

    const message = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are a personal finance assistant. Answer questions about the user's spending based on their transaction history.
Be concise and direct. Use numbers when relevant. Format amounts with $ sign.

Transaction history (last 6 months):
date | category | description | amount
${summary || '(no transactions yet)'}`,
      messages: [{ role: 'user', content: question }],
    })

    return (message.content[0] as { type: 'text'; text: string }).text
  }
}
