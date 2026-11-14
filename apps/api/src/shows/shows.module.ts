import { Module } from '@nestjs/common';
import { showImageBaseUrlProvider } from './show-image-url.js';
import { ShowsController } from './shows.controller.js';
import { ShowsService } from './shows.service.js';

@Module({
  controllers: [ShowsController],
  providers: [ShowsService, showImageBaseUrlProvider],
})
export class ShowsModule {}
