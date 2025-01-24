import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../commands/get-availaiblity.query';
import {
  ALQUILA_TU_CANCHA_CLIENT,
  AlquilaTuCanchaClient,
} from '../ports/aquila-tu-cancha.client';

@QueryHandler(GetAvailabilityQuery)
export class GetAvailabilityHandler
  implements IQueryHandler<GetAvailabilityQuery>
{
  constructor(
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private alquilaTuCanchaClient: AlquilaTuCanchaClient,
  ) {}

  async execute(query: GetAvailabilityQuery): Promise<ClubWithAvailability[]> {
    try {
      const clubs = await this.alquilaTuCanchaClient.getClubs(query.placeId);

      const clubsWithAvailability = await Promise.all(
        clubs.map(async (club) => {
          try {
            const courts = await this.alquilaTuCanchaClient.getCourts(club.id);
            const courtsWithAvailability = await Promise.all(
              courts.map(async (court) => {
                const slots =
                  await this.alquilaTuCanchaClient.getAvailableSlots(
                    club.id,
                    court.id,
                    query.date,
                  );
                return { ...court, available: slots };
              }),
            );

            return { ...club, courts: courtsWithAvailability };
          } catch (error) {
            console.error(`Error fetching courts for club ${club.id}:`, error);
            throw error;
          }
        }),
      );

      return clubsWithAvailability;
    } catch (error) {
      console.error('Error fetching availability data:', error);
      throw error;
    }
  }
}
