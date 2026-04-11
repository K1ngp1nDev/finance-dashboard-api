import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { TransactionsModule } from './transactions/transactions.module'
import { AiModule } from './ai/ai.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TransactionsModule,
    AiModule,
  ],
})
export class AppModule {}
