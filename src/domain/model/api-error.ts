export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
      [key: string]: any;
    };
    status?: number;
  };
  request?: any;
  message?: string;
}

export function formatApiError(error: ErrorResponse): ApiError {
  if (error.response) {
    return {
      message:
        error.response.data?.message || 'Error en la respuesta de la API',
      statusCode: error.response.status ?? 500,
      details: error.response.data ?? null,
    };
  }

  if (error.request) {
    return {
      message: 'No se recibió respuesta de la API',
      details: error.request,
    };
  }

  return {
    message: error.message || 'Error al procesar la solicitud',
    details: null,
  };
}
