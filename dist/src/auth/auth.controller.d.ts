import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        email: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        email: string;
    }>;
}
