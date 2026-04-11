export declare const CATEGORIES: readonly ["Food", "Transport", "Housing", "Healthcare", "Entertainment", "Shopping", "Education", "Travel", "Utilities", "Other"];
export type Category = (typeof CATEGORIES)[number];
export declare class CreateTransactionDto {
    description: string;
    amount: number;
    date: string;
    category?: Category;
    notes?: string;
}
export declare class UpdateTransactionDto {
    description?: string;
    amount?: number;
    date?: string;
    category?: Category;
    notes?: string;
}
export declare class TransactionFiltersDto {
    from?: string;
    to?: string;
    category?: Category;
}
