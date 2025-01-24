import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as moment from 'moment';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../../domain/commands/get-availaiblity.query';
import { memoryCache } from '../../infrastructure/cache/memory-cache';

const GetAvailabilitySchema = z.object({
  placeId: z.string(),
  date: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/)
    .refine((date) => moment(date).isValid())
    .transform((date) => moment(date).toDate()),
});

class GetAvailabilityDTO extends createZodDto(GetAvailabilitySchema) {}

@Controller('search')
export class SearchController {
  constructor(private queryBus: QueryBus) {}

  @Get()
  @UsePipes(ZodValidationPipe)
  async searchAvailability(
    @Query() query: GetAvailabilityDTO,
  ): Promise<ClubWithAvailability[]> {
    const cacheKey = `${query.placeId}-${moment(query.date).format(
      'YYYY-MM-DD',
    )}`;

    const cachedData = memoryCache.get(cacheKey);
    if (cachedData?.length) {
      console.log('Devolviendo datos desde la caché.');
      return cachedData;
    }

    const result = await this.queryBus.execute(
      new GetAvailabilityQuery(query.placeId, query.date),
    );

    memoryCache.set(cacheKey, result);
    console.log('Datos guardados en caché.');

    return result;
  }
}
