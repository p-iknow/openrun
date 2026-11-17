import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { SessionManager } from '../auth/session-manager.js';
import { type SignInBody, signInBodySchema } from './sign-in-body.js';
import { SessionUserDto } from './session.dto.js';
import { USER_SESSION_MANAGER } from './user-session.js';
import { UsersService } from './users.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(USER_SESSION_MANAGER)
    private readonly sessionManager: SessionManager,
  ) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SessionUserDto, description: '로그인한 사용자' })
  async signIn(
    @Body({ schema: signInBodySchema }) body: SignInBody,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionUserDto> {
    const userId = await this.usersService.verifyCredentials(body);
    await this.sessionManager.issue({
      request,
      response,
      subjectId: userId,
      rememberMe: body.rememberMe,
    });
    return this.usersService.findSessionUser(userId);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: '로그아웃했다. 세션이 이미 끊겼어도 같다.',
  })
  async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.sessionManager.revoke({ request, response });
  }

  // 헤더를 그릴 때마다 부르므로, 로그인하지 않았으면 오류가 아니라 null로 응답한다.
  // Nest는 핸들러가 null을 돌려주면 빈 본문을 보내므로, JSON null을 직접 쓴다.
  @Get('session')
  @ApiOkResponse({
    description: '현재 세션의 사용자. 로그인하지 않았으면 null이다.',
    schema: {
      nullable: true,
      allOf: [{ $ref: getSchemaPath(SessionUserDto) }],
    },
  })
  async getSession(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const session = await this.sessionManager.authenticate({
      request,
      response,
    });
    const body: SessionUserDto | null =
      session && (await this.usersService.findSessionUser(session.subjectId));
    response.json(body);
  }
}
