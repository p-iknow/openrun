import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { MeController } from './me.controller.js';
import { UserSessionStore } from './user-session-store.js';
import {
  USER_SESSION_MANAGER,
  userSessionManagerProvider,
} from './user-session.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [AuthController, MeController],
  providers: [UsersService, UserSessionStore, userSessionManagerProvider],
  // 다른 모듈이 UserSessionGuard를 붙이려면 사용자 세션의 SessionManager가 필요하다.
  exports: [USER_SESSION_MANAGER],
})
export class UsersModule {}
