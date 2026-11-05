export interface PairingResponseDto {
  id: number;
  name: string;
  category: string;
}

export interface CreatePairingRequestDto {
  name: string;
  category: string;
}

export interface UpdatePairingRequestDto {
  name: string;
  category: string;
}

