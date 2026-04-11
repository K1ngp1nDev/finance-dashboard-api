import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        email: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        email: string;
    }>;
    private signToken;
}
