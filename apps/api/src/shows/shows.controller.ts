import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { type ShowListQuery, showListQuerySchema } from './show-list-query.js';
import { ShowDetailDto, ShowPageDto } from './show.dto.js';
import { parseShowId } from './show-id.js';
import { ShowsService } from './shows.service.js';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get()
  @ApiOkResponse({ type: ShowPageDto })
  findPage(
    @Query({ schema: showListQuerySchema }) query: ShowListQuery,
  ): Promise<ShowPageDto> {
    return this.showsService.findPage(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'integer', description: '공연 ID' })
  @ApiOkResponse({ type: ShowDetailDto })
  findDetail(@Param('id') id: string): Promise<ShowDetailDto> {
    return this.showsService.findDetail(parseShowId(id));
  }
}
