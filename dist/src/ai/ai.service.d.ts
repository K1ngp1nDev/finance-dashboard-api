import { PrismaService } from '../prisma/prisma.service';
export declare class AiService {
    private prisma;
    private anthropic;
    constructor(prisma: PrismaService);
    query(userId: string, question: string): Promise<string>;
}
