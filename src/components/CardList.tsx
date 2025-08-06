import React, { useEffect, useState } from 'react';
import { Card, OwnershipStatus, User } from '../types';
import { CardDetailModal } from './CardDetailModal';
import './CardList.css';

interface CardListProps {
  cards: Card[];
  ownership: OwnershipStatus[];
  allOwnership: OwnershipStatus[];
  users: User[];
  currentUserId: string;
  onToggleOwnership: (cardId: string, owned: boolean) => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  ownership,
  allOwnership,
  users,
  currentUserId,
  onToggleOwnership,
}) => {
  const [filter, setFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(filter.toLowerCase()) ||
                         card.number.includes(filter);
    const matchesRarity = rarityFilter === 'all' || card.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const getMissingStatus = (cardId: string): boolean => {
    const status = ownership.find(o => o.cardId === cardId);
    return status?.owned || false;  // owned=trueは「持っていない」を意味する
  };

  const rarities = ['all', ...new Set(cards.map(card => card.rarity))];

  return (
    <div className="card-list-container">
      <div className="filters">
        <input
          type="text"
          placeholder="カード名または番号で検索..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="rarity-select"
        >
          {rarities.map(rarity => (
            <option key={rarity} value={rarity}>
              {rarity === 'all' ? '全てのレアリティ' : rarity}
            </option>
          ))}
        </select>
      </div>

      <div className="cards-grid">
        {filteredCards.map(card => {
          const isMissing = getMissingStatus(card.id);
          const missingUserIds = allOwnership
            .filter(o => o.cardId === card.id && o.owned)
            .map(o => o.userId);
          const missingUserNames = users
            .filter(u => missingUserIds.includes(u.id))
            .map(u => u.name);
          
          const hasMissingUsers = missingUserNames.length > 0;

          return (
            <div 
              key={card.id} 
              className={`card-item ${isMissing ? 'missing' : ''} ${hasMissingUsers ? 'has-missing-users' : ''}`}
              onClick={() => setSelectedCard(card)}
            >
              {card.imageUrl && (
                <img src={card.imageUrl} alt={card.name} className="card-image" />
              )}
              <div className="card-info">
                <h3>{card.name}</h3>
                <p className="card-number">No. {card.number}</p>
                <p className="card-rarity">{card.rarity}</p>
                <p className="card-series">{card.series}</p>
                <div className="ownership-section">
                  <label className={`ownership-checkbox ${isMissing ? 'checked' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isMissing}
                      onChange={(e) => onToggleOwnership(card.id, e.target.checked)}
                    />
                    <span className="checkbox-text">未所持</span>
                  </label>
                </div>
                {missingUserNames.length > 0 && missingUserNames.length < users.length && (
                  <div className="missing-indicator">
                    <div className="some-missing">
                      <span className="missing-badge">{missingUserNames.length}</span>
                      <span>人が未所持</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CardDetailModal
        card={selectedCard}
        users={users}
        allOwnership={allOwnership}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};