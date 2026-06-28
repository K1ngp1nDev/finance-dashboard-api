import { Injectable } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AiService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  private readonly demoMode =
    process.env.AI_DEMO_MODE === 'true' || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here'

  constructor(private prisma: PrismaService) {}

  async query(userId: string, question: string): Promise<string> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      orderBy: { date: 'desc' },
      take: 200,
    })

    if (this.demoMode) return this.demoAnswer(question, transactions)

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

  private demoAnswer(question: string, transactions: Array<{ category: string; description: string; amount: number; date: Date }>) {
    const expenses = transactions.filter((tx) => tx.category !== 'Income' && tx.amount >= 0)
    const income = transactions.filter((tx) => tx.category === 'Income' || tx.amount < 0)
    const expenseTotal = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    const incomeTotal = income.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    const byCategory = expenses.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.category] = (acc[tx.category] ?? 0) + Math.abs(tx.amount)
      return acc
    }, {})
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, total]) => `${category}: $${total.toFixed(2)}`)
      .join(', ')

    const normalizedQuestion = question.toLowerCase()
    if (normalizedQuestion.includes('food')) {
      return `Demo mode: Food spending in the loaded dataset is $${(byCategory.Food ?? 0).toFixed(2)}. This is based on seeded demo transactions and does not require an Anthropic API key.`
    }

    if (normalizedQuestion.includes('biggest') || normalizedQuestion.includes('top') || normalizedQuestion.includes('categor')) {
      return `Demo mode: Your biggest expense categories are ${topCategories || 'not available yet'}.`
    }

    if (normalizedQuestion.includes('cash flow') || normalizedQuestion.includes('summarize') || normalizedQuestion.includes('balance')) {
      return `Demo mode: Income is $${incomeTotal.toFixed(2)}, expenses are $${expenseTotal.toFixed(2)}, and net cash flow is $${(incomeTotal - expenseTotal).toFixed(2)} for the loaded transactions.`
    }

    return `Demo mode: I found ${transactions.length} transactions. Total income is $${incomeTotal.toFixed(2)}, total expenses are $${expenseTotal.toFixed(2)}, and the top categories are ${topCategories || 'not available yet'}.`
  }
}
