import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import type { AuthenticatedSession } from '../auth/session-manager.js';
import { CurrentSession } from '../auth/session-guard.js';
import { SessionUserDto } from './session.dto.js';
import { UserSessionGuard } from './user-session.js';
import { UsersService } from './users.service.js';

// 내 정보. 로그인 가드가 붙는 첫 API이고, 1.8에서 넓힌다.
@Controller('me')
@UseGuards(UserSessionGuard)
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ type: SessionUserDto })
  findMe(
    @CurrentSession() session: AuthenticatedSession,
  ): Promise<SessionUserDto> {
    return this.usersService.findSessionUser(session.subjectId);
  }
}
