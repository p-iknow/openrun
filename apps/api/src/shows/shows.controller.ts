import { Controller, Get } from '@nestjs/common';
import { ShowsService } from './shows.service.js';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get()
  findAll() {
    return this.showsService.findAll();
  }
}
