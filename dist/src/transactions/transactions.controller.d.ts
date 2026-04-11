import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto } from './dto/transaction.dto';
export declare class TransactionsController {
    private service;
    constructor(service: TransactionsService);
    findAll(req: any, filters: TransactionFiltersDto): Promise<{
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
    create(req: any, dto: CreateTransactionDto): Promise<{
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
    update(req: any, id: string, dto: UpdateTransactionDto): Promise<{
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
    remove(req: any, id: string): Promise<{
        success: boolean;
    }>;
    categorize(description: string): Promise<{
        category: "Food" | "Transport" | "Housing" | "Healthcare" | "Entertainment" | "Shopping" | "Education" | "Travel" | "Utilities" | "Other";
    }>;
    importCsv(req: any, file: Express.Multer.File): Promise<{
        imported: number;
    }>;
    getSummary(req: any): Promise<{
        total: number;
        count: number;
        byCategory: Record<string, number>;
        byMonth: Record<string, number>;
    }>;
}
