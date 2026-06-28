import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo12345'

interface DemoTransaction {
  userId: string
  category: string
  description: string
  amount: number
  date: Date
  notes: string
}

const expenseTemplates: Array<[string, string, number]> = [
  ['Food', 'Grocery Market', 84.25],
  ['Food', 'Coffee and lunch', 18.7],
  ['Rent', 'Apartment rent', 1450],
  ['Utilities', 'Electric and water bill', 142.5],
  ['Transport', 'Metro pass', 55],
  ['Transport', 'Uber ride', 24.8],
  ['Subscriptions', 'Netflix subscription', 15.99],
  ['Subscriptions', 'Cloud software subscription', 29],
  ['Shopping', 'Amazon household order', 76.4],
  ['Shopping', 'Clothing store', 129.9],
  ['Health', 'Pharmacy purchase', 31.2],
  ['Health', 'Dental clinic', 180],
  ['Travel', 'Weekend hotel booking', 260],
  ['Travel', 'Flight ticket', 420],
]

function monthsAgo(monthOffset: number, day: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - monthOffset)
  date.setDate(day)
  date.setHours(12, 0, 0, 0)
  return date
}

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10)
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { password },
    create: { email: DEMO_EMAIL, password },
  })

  await prisma.transaction.deleteMany({ where: { userId: user.id } })

  const transactions: DemoTransaction[] = []
  for (let month = 5; month >= 0; month--) {
    transactions.push({
      userId: user.id,
      category: 'Income',
      description: 'Monthly salary',
      amount: 5200 + (5 - month) * 120,
      date: monthsAgo(month, 1),
      notes: 'Seeded portfolio demo income',
    })

    transactions.push({
      userId: user.id,
      category: 'Income',
      description: 'Freelance client payment',
      amount: 650 + month * 35,
      date: monthsAgo(month, 18),
      notes: 'Seeded portfolio demo income',
    })

    for (let i = 0; i < expenseTemplates.length; i++) {
      const [category, description, baseAmount] = expenseTemplates[i]
      transactions.push({
        userId: user.id,
        category,
        description,
        amount: Number((Number(baseAmount) + month * 6 + i * 1.75).toFixed(2)),
        date: monthsAgo(month, 2 + ((i * 2) % 24)),
        notes: 'Seeded portfolio demo expense',
      })
    }
  }

  await prisma.transaction.createMany({ data: transactions })

  console.log(`Seeded ${transactions.length} transactions for ${DEMO_EMAIL}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
