import { Injectable, NotFoundException } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFiltersDto,
  CATEGORIES,
  Category,
} from './dto/transaction.dto'

@Injectable()
export class TransactionsService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  private readonly demoMode =
    process.env.AI_DEMO_MODE === 'true' || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here'

  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, filters: TransactionFiltersDto) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(filters.from || filters.to
          ? {
              date: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
      orderBy: { date: 'desc' },
    })
  }

  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        userId,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        category: dto.category ?? 'Other',
        notes: dto.notes,
      },
    })
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOne(userId, id)
    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    })
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id)
    await this.prisma.transaction.delete({ where: { id } })
    return { success: true }
  }

  private async findOne(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, userId } })
    if (!tx) throw new NotFoundException('Transaction not found')
    return tx
  }

  async categorize(description: string): Promise<Category> {
    if (this.demoMode) return this.demoCategorize(description)

    const message = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: `Categorize this transaction into exactly one of these categories: ${CATEGORIES.join(', ')}.
Transaction: "${description}"
Reply with only the category name, nothing else.`,
        },
      ],
    })

    const raw = (message.content[0] as { type: 'text'; text: string }).text.trim()
    const found = CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase())
    return found ?? 'Other'
  }

  private demoCategorize(description: string): Category {
    const text = description.toLowerCase()
    const rules: Array<[Category, string[]]> = [
      ['Income', ['salary', 'payroll', 'invoice', 'bonus', 'freelance', 'client payment']],
      ['Rent', ['rent', 'apartment', 'landlord']],
      ['Utilities', ['utility', 'electric', 'water', 'gas', 'internet', 'mobile', 'phone']],
      ['Food', ['restaurant', 'coffee', 'grocery', 'market', 'pizza', 'lunch', 'dinner', 'cafe']],
      ['Transport', ['uber', 'taxi', 'metro', 'fuel', 'parking', 'train', 'bus']],
      ['Subscriptions', ['netflix', 'spotify', 'subscription', 'saas', 'cloud', 'notion']],
      ['Shopping', ['amazon', 'mall', 'store', 'clothes', 'electronics']],
      ['Health', ['pharmacy', 'doctor', 'clinic', 'health', 'dental']],
      ['Travel', ['hotel', 'flight', 'airbnb', 'booking', 'travel']],
    ]

    return rules.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] ?? 'Other'
  }

  async importCsv(userId: string, csvText: string) {
    const lines = csvText.split('\n').filter((l) => l.trim())
    const rows = lines.slice(1)
    const created: string[] = []

    for (const row of rows) {
      const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      if (cols.length < 3) continue
      const [date, description, rawAmount] = cols
      const amount = parseFloat(rawAmount.replace(/[^0-9.-]/g, ''))
      if (isNaN(amount)) continue

      const category = await this.categorize(description)
      const tx = await this.prisma.transaction.create({
        data: { userId, description, amount, date: new Date(date), category },
      })
      created.push(tx.id)
    }

    return { imported: created.length }
  }

  async getAnalyticsSummary(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: { id: true, description: true, category: true, amount: true, date: true, notes: true },
      orderBy: { date: 'desc' },
    })

    const byCategory: Record<string, number> = {}
    const byMonth: Record<string, number> = {}
    const incomeByMonth: Record<string, number> = {}
    let totalIncome = 0
    let totalExpenses = 0

    for (const tx of transactions) {
      const isIncome = tx.category === 'Income' || tx.amount < 0
      const value = Math.abs(tx.amount)
      const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`

      if (isIncome) {
        totalIncome += value
        incomeByMonth[key] = (incomeByMonth[key] ?? 0) + value
      } else {
        totalExpenses += value
        byCategory[tx.category] = (byCategory[tx.category] ?? 0) + value
        byMonth[key] = (byMonth[key] ?? 0) + value
      }
    }

    const months = new Set([...Object.keys(byMonth), ...Object.keys(incomeByMonth)])
    const averageMonthlySpend = months.size ? totalExpenses / months.size : 0
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

    const largestExpenses = transactions
      .filter((tx) => tx.category !== 'Income' && tx.amount >= 0)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 8)

    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      averageMonthlySpend,
      count: transactions.length,
      byCategory,
      byMonth,
      incomeByMonth,
      recentTransactions: transactions.slice(0, 8),
      largestExpenses,
    }
  }
}
