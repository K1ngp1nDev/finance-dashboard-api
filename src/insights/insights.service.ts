import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CATEGORIES } from '../transactions/dto/transaction.dto'

const round2 = (n: number) => Math.round(n * 100) / 100
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

// Monthly budget targets per spending category (demo configuration).
const BUDGETS: Record<string, number> = {
  Food: 700,
  Rent: 1500,
  Utilities: 320,
  Transport: 260,
  Subscriptions: 140,
  Shopping: 420,
  Health: 220,
  Travel: 480,
}

// Demo categorization rule table (mirrors the AI demo categorizer).
const RULES: Array<{ category: string; keywords: string[] }> = [
  { category: 'Income', keywords: ['salary', 'payroll', 'invoice', 'bonus', 'freelance'] },
  { category: 'Rent', keywords: ['rent', 'apartment', 'landlord'] },
  { category: 'Utilities', keywords: ['utility', 'electric', 'water', 'gas', 'internet', 'mobile'] },
  { category: 'Food', keywords: ['restaurant', 'coffee', 'grocery', 'market', 'lunch', 'cafe'] },
  { category: 'Transport', keywords: ['uber', 'taxi', 'metro', 'fuel', 'parking', 'train'] },
  { category: 'Subscriptions', keywords: ['netflix', 'spotify', 'subscription', 'saas', 'notion'] },
  { category: 'Shopping', keywords: ['amazon', 'mall', 'store', 'clothes', 'electronics'] },
  { category: 'Health', keywords: ['pharmacy', 'doctor', 'clinic', 'health', 'dental'] },
  { category: 'Travel', keywords: ['hotel', 'flight', 'airbnb', 'booking', 'travel'] },
]

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  private load(userId: string) {
    return this.prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } })
  }

  async budgets(userId: string) {
    const txs = await this.load(userId)
    const months = new Set<string>()
    const byCategory: Record<string, number> = {}
    for (const t of txs) {
      if (t.category === 'Income' || t.amount < 0) continue
      months.add(monthKey(t.date))
      byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount)
    }
    const n = Math.max(1, months.size)
    const items = Object.entries(BUDGETS).map(([category, budget]) => {
      const spent = round2((byCategory[category] ?? 0) / n)
      return {
        category,
        budget,
        spent,
        remaining: round2(budget - spent),
        pct: Math.round((spent / budget) * 100),
        over: spent > budget,
      }
    })
    const totalBudget = items.reduce((s, b) => s + b.budget, 0)
    const totalSpent = round2(items.reduce((s, b) => s + b.spent, 0))
    return { items, totalBudget, totalSpent, overCount: items.filter((b) => b.over).length }
  }

  async subscriptions(userId: string) {
    const txs = await this.load(userId)
    const subs = txs.filter((t) => t.category === 'Subscriptions')
    const map = new Map<string, { amounts: number[]; dates: Date[] }>()
    for (const t of subs) {
      const e = map.get(t.description) ?? { amounts: [], dates: [] }
      e.amounts.push(Math.abs(t.amount))
      e.dates.push(t.date)
      map.set(t.description, e)
    }
    const items = [...map.entries()]
      .map(([merchant, e]) => {
        const amount = round2(e.amounts.reduce((a, b) => a + b, 0) / e.amounts.length)
        const last = e.dates.sort((a, b) => +b - +a)[0]
        const next = new Date(last)
        next.setMonth(next.getMonth() + 1)
        return {
          merchant,
          amount,
          cadence: 'Monthly',
          occurrences: e.amounts.length,
          lastCharge: last.toISOString(),
          nextCharge: next.toISOString(),
          category: 'Subscriptions',
          status: 'active' as const,
        }
      })
      .sort((a, b) => b.amount - a.amount)
    const monthlyTotal = round2(items.reduce((s, i) => s + i.amount, 0))
    return { items, monthlyTotal, annualTotal: round2(monthlyTotal * 12), count: items.length }
  }

  async goals(userId: string) {
    const txs = await this.load(userId)
    let income = 0
    let expense = 0
    const months = new Set<string>()
    for (const t of txs) {
      months.add(monthKey(t.date))
      const v = Math.abs(t.amount)
      if (t.category === 'Income' || t.amount < 0) income += v
      else expense += v
    }
    const monthlyNet = round2((income - expense) / Math.max(1, months.size))

    const defs = [
      { name: 'Emergency Fund', target: 12000, savedPct: 0.62, monthly: 600 },
      { name: 'Vacation 2026', target: 4000, savedPct: 0.45, monthly: 300 },
      { name: 'New Laptop', target: 2500, savedPct: 0.8, monthly: 200 },
      { name: 'Home Down Payment', target: 40000, savedPct: 0.18, monthly: 900 },
    ]
    const goals = defs.map((d) => {
      const saved = Math.round(d.target * d.savedPct)
      const remaining = d.target - saved
      const monthsToGoal = d.monthly > 0 ? Math.ceil(remaining / d.monthly) : null
      const history = Array.from({ length: 6 }, (_, i) => ({
        offset: 5 - i,
        amount: d.monthly,
      }))
      return {
        name: d.name,
        target: d.target,
        saved,
        remaining,
        pct: Math.round((saved / d.target) * 100),
        monthlyContribution: d.monthly,
        monthsToGoal,
        history,
      }
    })
    return { goals, monthlyNet, totalSaved: goals.reduce((s, g) => s + g.saved, 0), totalTarget: goals.reduce((s, g) => s + g.target, 0) }
  }

  async categories(userId: string) {
    const txs = await this.load(userId)
    const stats: Record<string, { count: number; total: number }> = {}
    let totalExpense = 0
    for (const t of txs) {
      const c = t.category
      stats[c] = stats[c] ?? { count: 0, total: 0 }
      stats[c].count++
      if (!(c === 'Income' || t.amount < 0)) {
        const v = Math.abs(t.amount)
        stats[c].total += v
        totalExpense += v
      }
    }
    const categories = CATEGORIES.map((c) => ({
      category: c,
      count: stats[c]?.count ?? 0,
      total: round2(stats[c]?.total ?? 0),
      share: totalExpense ? Math.round(((stats[c]?.total ?? 0) / totalExpense) * 100) : 0,
    }))
    return { categories, rules: RULES, totalExpense: round2(totalExpense) }
  }
}
