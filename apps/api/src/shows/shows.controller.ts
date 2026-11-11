import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ShowListQueryDto, ShowPageDto } from './show.dto.js';
import { ShowsService } from './shows.service.js';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get()
  @ApiOkResponse({ type: ShowPageDto })
  findPage(@Query() query: ShowListQueryDto): Promise<ShowPageDto> {
    return this.showsService.findPage(query);
  }
}
