import React from 'react';
import { Card, User, OwnershipStatus } from '../types';
import './CardDetailModal.css';

interface CardDetailModalProps {
  card: Card | null;
  users: User[];
  allOwnership: OwnershipStatus[];
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  users,
  allOwnership,
  onClose,
}) => {
  if (!card) return null;

  // このカードを持っていないユーザーを取得
  const missingUserIds = allOwnership
    .filter(o => o.cardId === card.id && o.owned)
    .map(o => o.userId);
  
  const missingUsers = users.filter(u => missingUserIds.includes(u.id));
  const owningUsers = users.filter(u => !missingUserIds.includes(u.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
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

        <div className="ownership-summary">
          <div className="ownership-stat">
            <span className="stat-label">所持</span>
            <span className="stat-value owned">{owningUsers.length}人</span>
          </div>
          <div className="ownership-stat">
            <span className="stat-label">未所持</span>
            <span className="stat-value missing">{missingUsers.length}人</span>
          </div>
        </div>

        <div className="user-lists">
          <div className="user-list-section">
            <h3>持っていない人 ({missingUsers.length}人)</h3>
            {missingUsers.length > 0 ? (
              <ul className="user-list missing-users-list">
                {missingUsers.map(user => (
                  <li key={user.id} className="user-item missing">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{user.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-users">全員が所持しています！</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};