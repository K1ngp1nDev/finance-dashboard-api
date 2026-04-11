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
      select: { category: true, amount: true, date: true },
    })

    const byCategory: Record<string, number> = {}
    for (const tx of transactions) {
      byCategory[tx.category] = (byCategory[tx.category] ?? 0) + tx.amount
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const byMonth: Record<string, number> = {}
    for (const tx of transactions) {
      if (tx.date < sixMonthsAgo) continue
      const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`
      byMonth[key] = (byMonth[key] ?? 0) + tx.amount
    }

    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const count = transactions.length

    return { total, count, byCategory, byMonth }
  }
}
