import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto, Category } from './dto/transaction.dto';
export declare class TransactionsService {
    private prisma;
    private anthropic;
    constructor(prisma: PrismaService);
    findAll(userId: string, filters: TransactionFiltersDto): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        amount: number;
        date: Date;
        category: string;
        notes: string | null;
        userId: string;
        updatedAt: Date;
    }[]>;
    create(userId: string, dto: CreateTransactionDto): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        amount: number;
        date: Date;
        category: string;
        notes: string | null;
        userId: string;
        updatedAt: Date;
    }>;
    update(userId: string, id: string, dto: UpdateTransactionDto): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        amount: number;
        date: Date;
        category: string;
        notes: string | null;
        userId: string;
        updatedAt: Date;
    }>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
    private findOne;
    categorize(description: string): Promise<Category>;
    importCsv(userId: string, csvText: string): Promise<{
        imported: number;
    }>;
    getAnalyticsSummary(userId: string): Promise<{
        total: number;
        count: number;
        byCategory: Record<string, number>;
        byMonth: Record<string, number>;
    }>;
}
