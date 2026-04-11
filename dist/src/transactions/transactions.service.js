"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const prisma_service_1 = require("../prisma/prisma.service");
const transaction_dto_1 = require("./dto/transaction.dto");
let TransactionsService = class TransactionsService {
    prisma;
    anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, filters) {
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
        });
    }
    async create(userId, dto) {
        return this.prisma.transaction.create({
            data: {
                userId,
                description: dto.description,
                amount: dto.amount,
                date: new Date(dto.date),
                category: dto.category ?? 'Other',
                notes: dto.notes,
            },
        });
    }
    async update(userId, id, dto) {
        await this.findOne(userId, id);
        return this.prisma.transaction.update({
            where: { id },
            data: {
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
                ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
                ...(dto.category !== undefined ? { category: dto.category } : {}),
                ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
            },
        });
    }
    async remove(userId, id) {
        await this.findOne(userId, id);
        await this.prisma.transaction.delete({ where: { id } });
        return { success: true };
    }
    async findOne(userId, id) {
        const tx = await this.prisma.transaction.findFirst({ where: { id, userId } });
        if (!tx)
            throw new common_1.NotFoundException('Transaction not found');
        return tx;
    }
    async categorize(description) {
        const message = await this.anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 20,
            messages: [
                {
                    role: 'user',
                    content: `Categorize this transaction into exactly one of these categories: ${transaction_dto_1.CATEGORIES.join(', ')}.
Transaction: "${description}"
Reply with only the category name, nothing else.`,
                },
            ],
        });
        const raw = message.content[0].text.trim();
        const found = transaction_dto_1.CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
        return found ?? 'Other';
    }
    async importCsv(userId, csvText) {
        const lines = csvText.split('\n').filter((l) => l.trim());
        const rows = lines.slice(1);
        const created = [];
        for (const row of rows) {
            const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            if (cols.length < 3)
                continue;
            const [date, description, rawAmount] = cols;
            const amount = parseFloat(rawAmount.replace(/[^0-9.-]/g, ''));
            if (isNaN(amount))
                continue;
            const category = await this.categorize(description);
            const tx = await this.prisma.transaction.create({
                data: { userId, description, amount, date: new Date(date), category },
            });
            created.push(tx.id);
        }
        return { imported: created.length };
    }
    async getAnalyticsSummary(userId) {
        const transactions = await this.prisma.transaction.findMany({
            where: { userId },
            select: { category: true, amount: true, date: true },
        });
        const byCategory = {};
        for (const tx of transactions) {
            byCategory[tx.category] = (byCategory[tx.category] ?? 0) + tx.amount;
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const byMonth = {};
        for (const tx of transactions) {
            if (tx.date < sixMonthsAgo)
                continue;
            const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
            byMonth[key] = (byMonth[key] ?? 0) + tx.amount;
        }
        const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const count = transactions.length;
        return { total, count, byCategory, byMonth };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map