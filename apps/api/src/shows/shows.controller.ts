import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ShowPageDto } from './show.dto.js';
import { ShowsService } from './shows.service.js';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get()
  @ApiOkResponse({ type: ShowPageDto })
  findPage(): Promise<ShowPageDto> {
    return this.showsService.findPage();
  }
}
