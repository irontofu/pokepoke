export interface Card {
  id: string;
  number: string;
  name: string;
  rarity: string;
  series: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface OwnershipStatus {
  cardId: string;
  userId: string;
  notOwned: boolean;
  tradeable?: boolean;
  notes?: string;
}

export interface CollectionStats {
  userId: string;
  totalCards: number;
  ownedCards: number;
  completionRate: number;
  byRarity: {
    [rarity: string]: {
      total: number;
      owned: number;
    };
  };
}