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

  const getUnownedByAnyone = () => {
    // notOwned=trueは「持っていない」を意味するので、全ユーザーのnotOwned=trueを集計
    const cardMissingCount: { [cardId: string]: number } = {};
    ownership.filter(o => o.notOwned).forEach(o => {
      cardMissingCount[o.cardId] = (cardMissingCount[o.cardId] || 0) + 1;
    });
    
    // 全ユーザー数と同じ数の人が持っていないカード
    return cards.filter(card => cardMissingCount[card.id] === users.length);
  };

  return (
    <div className="stats-container">
      <h2>{currentUser?.name || 'ゲスト'}の統計</h2>
      
      <div className="stats-grid">
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

        <div className="stat-card">
          <h3>誰も持っていないカード</h3>
          <p className="unowned-count">{getUnownedByAnyone().length} 枚</p>
          <div className="unowned-list">
            {getUnownedByAnyone().slice(0, 5).map(card => (
              <div key={card.id} className="unowned-item">
                {card.number}: {card.name}
              </div>
            ))}
            {getUnownedByAnyone().length > 5 && (
              <p className="more-items">...他 {getUnownedByAnyone().length - 5} 枚</p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <h3>持っていないカード</h3>
          <p className="missing-count">{getMissingCards().length} 枚</p>
          <div className="missing-list">
            {getMissingCards().slice(0, 5).map(card => (
              <div key={card.id} className="missing-item">
                {card.number}: {card.name} ({card.rarity})
              </div>
            ))}
            {getMissingCards().length > 5 && (
              <p className="more-items">...他 {getMissingCards().length - 5} 枚</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};