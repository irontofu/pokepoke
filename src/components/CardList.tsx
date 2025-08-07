import React, { useState } from 'react';
import { Card, OwnershipStatus, User, Pack, Rarity } from '../types';
import { CardDetailModal } from './CardDetailModal';
import './CardList.css';

interface CardListProps {
  cards: Card[];
  packs: Pack[];
  rarities: Rarity[];
  ownership: OwnershipStatus[];
  allOwnership: OwnershipStatus[];
  users: User[];
  currentUserId: string;
  loggedInUserId: string | null;
  onToggleNotOwned: (cardId: string, notOwned: boolean) => void;
  onToggleTradeable: (cardId: string, tradeable: boolean) => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  packs,
  rarities,
  ownership,
  allOwnership,
  users,
  currentUserId,
  loggedInUserId,
  onToggleNotOwned,
  onToggleTradeable,
}) => {
  const [filter, setFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('tradeable');
  const [seriesFilter, setSeriesFilter] = useState('tradeable');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);


  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(filter.toLowerCase()) ||
                         card.number.includes(filter);
    
    // レアリティフィルターの処理
    let matchesRarity = false;
    if (rarityFilter === 'all') {
      matchesRarity = true;
    } else if (rarityFilter === 'tradeable') {
      // 交換可能レアリティのみ表示
      const cardRarity = rarities.find(r => r.name === card.rarity);
      matchesRarity = cardRarity?.isActive || false;
    } else {
      matchesRarity = card.rarity === rarityFilter;
    }
    
    // シリーズフィルターの処理
    let matchesSeries = false;
    if (seriesFilter === 'all') {
      matchesSeries = true;
    } else if (seriesFilter === 'tradeable') {
      // 交換可能パックのみ表示
      const cardPack = packs.find(p => p.name === card.series);
      matchesSeries = cardPack?.isActive || false;
    } else {
      matchesSeries = card.series === seriesFilter;
    }
    
    
    return matchesSearch && matchesRarity && matchesSeries;
  });

  const getNotOwnedStatus = (cardId: string): boolean => {
    const status = ownership.find(o => o.cardId === cardId);
    return status?.notOwned || false;
  };

  const getTradeableStatus = (cardId: string): boolean => {
    const status = ownership.find(o => o.cardId === cardId);
    return status?.tradeable || false;
  };

  const raritiesFilter = ['all', 'tradeable', ...new Set(cards.map(card => card.rarity))];
  const series = ['all', 'tradeable', ...new Set(cards.map(card => card.series))];

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
          {raritiesFilter.map(rarity => (
            <option key={rarity} value={rarity}>
              {rarity === 'all' ? '全てのレアリティ' : rarity === 'tradeable' ? '交換可能レアリティ' : rarity}
            </option>
          ))}
        </select>
        <select
          value={seriesFilter}
          onChange={(e) => setSeriesFilter(e.target.value)}
          className="series-select"
        >
          {series.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? '全てのシリーズ' : s === 'tradeable' ? '交換可能パック' : s}
            </option>
          ))}
        </select>
      </div>

      <div className="cards-grid">
        {filteredCards.map(card => {
          const isNotOwned = getNotOwnedStatus(card.id);
          const isTradeable = getTradeableStatus(card.id);
          const missingUserIds = allOwnership
            .filter(o => o.cardId === card.id && o.notOwned)
            .map(o => o.userId);
          const missingUserNames = users
            .filter(u => missingUserIds.includes(u.id))
            .map(u => u.name);
          
          const hasMissingUsers = missingUserNames.length > 0;
          
          // 交換可能なユーザーを取得
          const tradeableUserIds = allOwnership
            .filter(o => o.cardId === card.id && o.notOwned && o.tradeable && o.userId !== currentUserId)
            .map(o => o.userId);
          const tradeableUserNames = users
            .filter(u => tradeableUserIds.includes(u.id))
            .map(u => u.name);
          const hasTradeableUsers = tradeableUserNames.length > 0 && isNotOwned;

          return (
            <div 
              key={card.id} 
              className={`card-item ${isNotOwned ? 'missing' : ''} ${hasMissingUsers ? 'has-missing-users' : ''} ${hasTradeableUsers ? 'has-tradeable-users' : ''}`}
              onClick={() => setSelectedCard(card)}
            >
              {card.imageUrl && (
                <img src={card.imageUrl} alt={card.name} className="card-image" />
              )}
              <div className="card-info">
                <h3>{card.name}</h3>
                <p className="card-series">{card.series}</p>
                <p className="card-number">No. {card.number}</p>
                <p className="card-rarity">{card.rarity}</p>
                <div className="ownership-section">
                  <label className={`ownership-checkbox ${isNotOwned ? 'checked' : ''} ${currentUserId !== loggedInUserId ? 'readonly' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isNotOwned}
                      onChange={(e) => onToggleNotOwned(card.id, e.target.checked)}
                      disabled={currentUserId !== loggedInUserId}
                    />
                    <span className="checkbox-text">未所持</span>
                  </label>
                  <label className={`ownership-checkbox tradeable ${isTradeable ? 'checked' : ''} ${currentUserId !== loggedInUserId ? 'readonly' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isTradeable}
                      onChange={(e) => onToggleTradeable(card.id, e.target.checked)}
                      disabled={currentUserId !== loggedInUserId}
                    />
                    <span className="checkbox-text">交換可能</span>
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
                {hasTradeableUsers && (
                  <div className="tradeable-indicator" title={`交換可能: ${tradeableUserNames.join(', ')}`}>
                    <div className="some-tradeable">
                      <span className="tradeable-badge">{tradeableUserNames.length}</span>
                      <span>人が交換可能</span>
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