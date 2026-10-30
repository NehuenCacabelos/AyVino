/**
 * Respuesta de subida exitosa de imagen con identificador único UUID.
 */
export interface ImageUploadResultDto {
  imageId: string;
}

/**
 * @deprecated Utilizar ImageUploadResultDto.
 */
export interface ImageUploadResponseDto {
  url: string;
}
