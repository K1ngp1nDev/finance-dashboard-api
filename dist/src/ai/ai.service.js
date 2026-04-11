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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const prisma_service_1 = require("../prisma/prisma.service");
let AiService = class AiService {
    prisma;
    anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    constructor(prisma) {
        this.prisma = prisma;
    }
    async query(userId, question) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const transactions = await this.prisma.transaction.findMany({
            where: { userId, date: { gte: sixMonthsAgo } },
            orderBy: { date: 'desc' },
            take: 200,
        });
        const summary = transactions
            .map((t) => `${t.date.toISOString().split('T')[0]} | ${t.category} | ${t.description} | $${t.amount.toFixed(2)}`)
            .join('\n');
        const message = await this.anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: `You are a personal finance assistant. Answer questions about the user's spending based on their transaction history.
Be concise and direct. Use numbers when relevant. Format amounts with $ sign.

Transaction history (last 6 months):
date | category | description | amount
${summary || '(no transactions yet)'}`,
            messages: [{ role: 'user', content: question }],
        });
        return message.content[0].text;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map