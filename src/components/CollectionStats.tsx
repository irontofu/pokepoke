import React from 'react';
import { Card, OwnershipStatus, User } from '../types';
import './CollectionStats.css';

interface CollectionStatsProps {
  cards: Card[];
  ownership: OwnershipStatus[];
  users: User[];
  currentUserId: string;
}

export const CollectionStats: React.FC<CollectionStatsProps> = ({
  cards,
  ownership,
  users,
  currentUserId,
}) => {
  const calculateStats = (userId: string) => {
    const userMissing = ownership.filter(o => o.userId === userId && o.notOwned);
    const missingCards = userMissing.length;
    const totalCards = cards.length;
    const ownedCards = totalCards - missingCards;
    const completionRate = totalCards > 0 ? (ownedCards / totalCards) * 100 : 0;

    const byRarity: { [key: string]: { total: number; owned: number } } = {};
    
    cards.forEach(card => {
      if (!byRarity[card.rarity]) {
        byRarity[card.rarity] = { total: 0, owned: 0 };
      }
      byRarity[card.rarity].total++;
      
      if (!userMissing.some(o => o.cardId === card.id)) {
        byRarity[card.rarity].owned++;
      }
    });

    return {
      ownedCards,
      totalCards,
      completionRate,
      byRarity,
    };
  };

  const userStats = calculateStats(currentUserId);
  const currentUser = users.find(u => u.id === currentUserId);

  const getMissingCards = () => {
    const userMissing = ownership.filter(o => o.userId === currentUserId && o.notOwned);
    const missingCardIds = new Set(userMissing.map(o => o.cardId));
    return cards.filter(card => missingCardIds.has(card.id));
  };


  return (
    <div className="stats-container">
      <h2>{currentUser?.name || 'ゲスト'}の統計</h2>
      
      <div className="stats-grid">
        <div className="stats-left">
          <div className="stat-card">
            <h3>全体の進捗</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${userStats.completionRate}%` }}
              />
            </div>
            <p>{userStats.ownedCards} / {userStats.totalCards} カード</p>
            <p className="completion-rate">{userStats.completionRate.toFixed(1)}% 完了</p>
          </div>

          <div className="stat-card">
            <h3>レアリティ別統計</h3>
            {Object.entries(userStats.byRarity).map(([rarity, stats]) => (
              <div key={rarity} className="rarity-stat">
                <span className="rarity-name">{rarity}</span>
                <span className="rarity-count">
                  {stats.owned} / {stats.total}
                </span>
                <div className="mini-progress">
                  <div 
                    className="mini-progress-fill" 
                    style={{ width: `${(stats.owned / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card missing-cards-full">
          <h3>持っていないカード</h3>
          <p className="missing-count">{getMissingCards().length} 枚</p>
          <div className="missing-list scrollable">
            {getMissingCards().map(card => (
              <div key={card.id} className="missing-item">
                <span className="card-number">{card.number}</span>
                <span className="card-name">{card.name}</span>
                <span className="card-rarity">{card.rarity}</span>
                <span className="card-series">{card.series}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};