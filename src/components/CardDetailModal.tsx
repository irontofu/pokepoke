import React from 'react';
import { Card, User, OwnershipStatus } from '../types';
import './CardDetailModal.css';

interface CardDetailModalProps {
  card: Card | null;
  users: User[];
  allOwnership: OwnershipStatus[];
  currentUserId: string;
  loggedInUserId: string | null;
  isOwnedByUser: boolean;
  isTradeableByUser: boolean;
  onToggleOwnership: (cardId: string, notOwned: boolean) => void;
  onToggleTradeable: (cardId: string, tradeable: boolean) => void;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  users,
  allOwnership,
  currentUserId,
  loggedInUserId,
  isOwnedByUser,
  isTradeableByUser,
  onToggleOwnership,
  onToggleTradeable,
  onClose,
}) => {
  if (!card) return null;

  // このカードを持っていないユーザーを取得
  const missingUserIds = allOwnership
    .filter(o => o.cardId === card.id && o.notOwned)
    .map(o => o.userId);
  
  const missingUsers = users.filter(u => missingUserIds.includes(u.id));
  
  // 交換可能なユーザーを取得
  const tradeableOwnership = allOwnership
    .filter(o => o.cardId === card.id && o.tradeable);
  
  const tradeableUsers = users.filter(u => 
    tradeableOwnership.some(o => o.userId === u.id)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <button className="modal-close" onClick={onClose}>×</button>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="card-detail">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="card-detail-image" />
          ) : (
            <div className="card-detail-image-placeholder">
              <span>No Image</span>
            </div>
          )}
          
          <div className="card-detail-info">
            <h2>{card.name}</h2>
            <p className="card-detail-number">No. {card.number}</p>
            <p className="card-detail-rarity">レアリティ: {card.rarity}</p>
            <p className="card-detail-series">シリーズ: {card.series}</p>
          </div>
        </div>

        <div className="ownership-controls">
          <label className={`ownership-checkbox ${!isOwnedByUser ? 'checked' : ''} ${currentUserId !== loggedInUserId ? 'readonly' : ''}`}>
            <input
              type="checkbox"
              checked={!isOwnedByUser}
              onChange={(e) => onToggleOwnership(card.id, e.target.checked)}
              disabled={currentUserId !== loggedInUserId}
            />
            <span className="checkbox-text">未所持</span>
          </label>
          <label className={`ownership-checkbox tradeable ${isTradeableByUser ? 'checked' : ''} ${currentUserId !== loggedInUserId ? 'readonly' : ''}`}>
            <input
              type="checkbox"
              checked={isTradeableByUser}
              onChange={(e) => onToggleTradeable(card.id, e.target.checked)}
              disabled={currentUserId !== loggedInUserId}
            />
            <span className="checkbox-text">交換可能</span>
          </label>
        </div>

        <div className="user-lists">
          <div className="user-list-section">
            <h3>持っていない人 ({missingUsers.length}人)</h3>
            {missingUsers.length > 0 ? (
              <ul className="user-list missing-users-list">
                {missingUsers.map(user => {
                  // この未所持者以外で交換可能な人がいるかチェック
                  const canReceiveFromOthers = tradeableOwnership.some(o => 
                    o.userId !== user.id && !o.notOwned
                  );
                  return (
                    <li key={user.id} className={`user-item missing ${canReceiveFromOthers ? 'tradeable' : ''}`}>
                      <span className="user-name">{user.name}</span>
                      {canReceiveFromOthers && <span className="tradeable-badge">入手可能</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="no-users">全員が所持しています！</p>
            )}
          </div>

          <div className="user-list-section">
            <h3>交換可能な人 ({tradeableUsers.length}人)</h3>
            {tradeableUsers.length > 0 ? (
              <ul className="user-list tradeable-users-list">
                {tradeableUsers.map(user => {
                  const ownership = tradeableOwnership.find(o => o.userId === user.id);
                  const isOwned = !ownership?.notOwned;
                  return (
                    <li key={user.id} className={`user-item tradeable ${isOwned ? 'owned' : 'missing'}`}>
                      <span className="user-name">{user.name}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="no-users">交換可能な人はいません</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};