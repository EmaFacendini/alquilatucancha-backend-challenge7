import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axiosRetry from 'axios-retry';
import * as moment from 'moment';

import { formatApiError } from '../../domain/model/api-error';
import { Club } from '../../domain/model/club';
import { Court } from '../../domain/model/court';
import { Slot } from '../../domain/model/slot';
import { AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';

interface ErrorResponse {
  response?: {
    status: number;
  };
  message: string;
}

@Injectable()
export class HTTPAlquilaTuCanchaClient implements AlquilaTuCanchaClient {
  private readonly logger = new Logger(HTTPAlquilaTuCanchaClient.name);
  private readonly baseUrl: string;
  private readonly defaultTimeout = 5000;
  private readonly dateFormat = 'YYYY-MM-DD';

  constructor(private httpService: HttpService, private config: ConfigService) {
    this.baseUrl = this.config.get<string>(
      'ATC_BASE_URL',
      'http://localhost:4000',
    );

    // Configuración de reintentos
    axiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: (retryCount) => {
        this.logger.warn(`Reintentando solicitud: intento #${retryCount}`);
        return retryCount * 1000;
      },
      retryCondition: (error) => {
        return error.response?.status === 500 || !error.response;
      },
    });
  }

  async getClubs(placeId: string): Promise<Club[]> {
    return this.makeGetRequest<Club[]>('clubs', { placeId });
  }

  async getCourts(clubId: number): Promise<Court[]> {
    return this.makeGetRequest<Court[]>(`/clubs/${clubId}/courts`);
  }

  async getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[]> {
    const formattedDate = moment(date).format(this.dateFormat);
    return this.makeGetRequest<Slot[]>(
      `/clubs/${clubId}/courts/${courtId}/slots`,
      { date: formattedDate },
    );
  }

  /**
   * Método auxiliar para realizar solicitudes GET.
   */
  private async makeGetRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    try {
      const response = await this.httpService.axiosRef.get<T>(endpoint, {
        baseURL: this.baseUrl,
        params,
        timeout: this.defaultTimeout,
      });
      return response.data;
    } catch (error) {
      const formattedError = formatApiError(error as ErrorResponse);
      this.logger.error(
        `Error en la solicitud a ${endpoint}: ${formattedError.message}`,
        {
          params,
          details: formattedError.details,
        },
      );
      return [] as unknown as T; // Retorno vacío para evitar errores en los métodos.
    }
  }
}
