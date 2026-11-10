import { Module } from '@nestjs/common';
import { posterBaseUrlProvider } from './poster-url.js';
import { ShowsController } from './shows.controller.js';
import { ShowsService } from './shows.service.js';

@Module({
  controllers: [ShowsController],
  providers: [ShowsService, posterBaseUrlProvider],
})
export class ShowsModule {}
