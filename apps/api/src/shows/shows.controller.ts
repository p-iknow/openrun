import { Controller, Get } from '@nestjs/common';

@Controller('shows')
export class ShowsController {
  @Get()
  findAll() {
    return [];
  }
}
