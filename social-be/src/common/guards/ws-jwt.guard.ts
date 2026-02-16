import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import * as cookie from 'cookie';

type SocketLike = {
  handshake?: {
    auth?: Record<string, any>;
    query?: Record<string, any>;
    headers?: Record<string, any>;
  };
  data?: Record<string, any>;
};

function extractToken(client: SocketLike): string | undefined {
  const hs = client?.handshake;

  // 1) auth.token (socket.io recommended)
  const fromAuth = hs?.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth) return fromAuth;

  // 2) Authorization: Bearer <token>
  const authz = hs?.headers?.authorization as string | undefined;
  if (authz?.startsWith('Bearer ')) return authz.slice(7);

  // 3) Cookie
  const rawCookie = hs?.headers?.cookie as string | undefined;
  if (rawCookie) {
    const cookies = cookie.parse(rawCookie);
    const token = cookies['accessToken'] || cookies['jwt'] || cookies['token'];
    if (token) return token;
  }

  const fromQuery = hs?.query?.token as string | undefined;
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;

  return undefined;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<SocketLike>();

    const token = extractToken(client);
    if (!token) throw new WsException('Unauthorized');

    try {
      const opts: JwtVerifyOptions = {
        secret: this.configService.get<string>('config.jwt.secret'),
        algorithms: ['HS256'],
        clockTolerance: 5, // second
      };

      const payload = await this.jwtService.verifyAsync(token, opts);

      // Sub is required
      if (!payload?.sub) throw new WsException('Unauthorized');

      client.data = client.data || {};
      client.data.userId = payload.sub;
      client.data.roles = payload.roles ?? [];
      // client.data.jwt = payload; // if needed

      return true;
    } catch (err: any) {
      throw new WsException('Unauthorized');
    }
  }
}
