import apiClient from '../../../services/apiClient';
import type {
  WineResponseDto,
  GetAdminWinesParams,
  UpdateWineAdminRequest,
} from '../types/adminWines';

/**
 * Lista vinos paginados. Si se especifican criterios de búsqueda (nombre, bodega o tipo),
 * utiliza /wines/search; de lo contrario utiliza /wines.
 */
export async function getAdminWines(
  params?: GetAdminWinesParams
): Promise<WineResponseDto[]> {
  const hasFilter = Boolean(
    params?.name?.trim() || params?.winery?.trim() || params?.wineType
  );

  if (hasFilter) {
    const response = await apiClient.get<WineResponseDto[]>('/wines/search', {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        name: params?.name?.trim() || undefined,
        winery: params?.winery?.trim() || undefined,
        wineType: params?.wineType || undefined,
      },
    });
    return response.data;
  }

  const response = await apiClient.get<WineResponseDto[]>('/wines', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  });
  return response.data;
}

/**
 * Actualiza los datos de una etiqueta de vino como administrador.
 * PUT /api/wines/{id}
 */
export async function updateWine(
  id: number,
  data: UpdateWineAdminRequest
): Promise<WineResponseDto> {
  const response = await apiClient.put<WineResponseDto>(`/wines/${id}`, data);
  return response.data;
}

/**
 * Elimina una etiqueta de vino (solo administrador).
 * DELETE /api/wines/{id}
 */
export async function deleteWine(id: number): Promise<void> {
  await apiClient.delete(`/wines/${id}`);
}
