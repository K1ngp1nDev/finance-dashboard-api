import { AiService } from './ai.service';
declare class AiQueryDto {
    question: string;
}
export declare class AiController {
    private service;
    constructor(service: AiService);
    query(req: any, dto: AiQueryDto): Promise<{
        answer: string;
    }>;
}
export {};
