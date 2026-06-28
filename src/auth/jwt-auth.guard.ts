import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.DEMO_AUTH_DISABLED === 'true') {
      const request = context.switchToHttp().getRequest()
      const demoUser = await this.prisma.user.findUnique({
        where: { email: 'demo@example.com' },
      })
      if (!demoUser) throw new UnauthorizedException('Demo user is not seeded')
      request.user = { id: demoUser.id, email: demoUser.email }
      return true
    }

    return (await super.canActivate(context)) as boolean
  }
}
