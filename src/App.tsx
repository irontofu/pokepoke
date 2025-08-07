import React, { useEffect, useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CardList } from './components/CardList';
import { CollectionStats } from './components/CollectionStats';
import { GoogleSheetsService } from './services/googleSheets';
import { Card, User, OwnershipStatus } from './types';
import './App.css';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ownership, setOwnership] = useState<OwnershipStatus[]>([]);
  const [allOwnership, setAllOwnership] = useState<OwnershipStatus[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('user1');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'stats'>('cards');
  const [isSignedIn, setIsSignedIn] = useState(false);

  const sheetsService = GoogleSheetsService.getInstance();

  const initializeApp = useCallback(async () => {
    try {
      setLoading(true);
      await sheetsService.initialize();
      setIsSignedIn(sheetsService.isSignedIn());
      if (sheetsService.isSignedIn()) {
        // 初期化時も現在のユーザーを設定
        const [cardsData, usersData, allOwnershipData] = await Promise.all([
          sheetsService.getCards(),
          sheetsService.getUsers(),
          sheetsService.getAllOwnershipStatus(),
        ]);

        setCards(cardsData);
        setUsers(usersData);
        setAllOwnership(allOwnershipData);

        const userInfo = await sheetsService.getUserInfo();
        if (userInfo && userInfo.email) {
          const currentUser = usersData.find(u => u.email === userInfo.email);
          if (currentUser) {
            setCurrentUserId(currentUser.id);
            const ownershipData = allOwnershipData.filter(o => o.userId === currentUser.id);
            setOwnership(ownershipData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  }, [sheetsService]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleSignIn = async () => {
    try {
      await sheetsService.signIn();
      setIsSignedIn(true);

      // サインイン直後に少し待機（新規ユーザー登録の反映待ち）
      await new Promise(resolve => setTimeout(resolve, 500));

      // ユーザー情報が更新されているので、データを再読み込み
      const [cardsData, usersData, allOwnershipData] = await Promise.all([
        sheetsService.getCards(),
        sheetsService.getUsers(),
        sheetsService.getAllOwnershipStatus(),
      ]);

      setCards(cardsData);
      setUsers(usersData);
      setAllOwnership(allOwnershipData);

      // ログインしたユーザーのメールアドレスから現在のユーザーを特定
      const userInfo = await sheetsService.getUserInfo();
      if (userInfo && userInfo.email) {
        const currentUser = usersData.find(u => u.email === userInfo.email);
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          // 現在のユーザーの所持状況を読み込み
          const ownershipData = allOwnershipData.filter(o => o.userId === currentUser.id);
          setOwnership(ownershipData);
        } else {
          console.error('Current user not found in users list:', userInfo.email);
          // 再度ユーザー一覧を取得
          const refreshedUsers = await sheetsService.getUsers();
          const refreshedUser = refreshedUsers.find(u => u.email === userInfo.email);
          if (refreshedUser) {
            setUsers(refreshedUsers);
            setCurrentUserId(refreshedUser.id);
            const ownershipData = allOwnershipData.filter(o => o.userId === refreshedUser.id);
            setOwnership(ownershipData);
          }
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = () => {
    sheetsService.signOut();
    setIsSignedIn(false);
    setCards([]);
    setUsers([]);
    setOwnership([]);
  };

  const loadData = async () => {
    const [cardsData, usersData, ownershipData, allOwnershipData] = await Promise.all([
      sheetsService.getCards(),
      sheetsService.getUsers(),
      sheetsService.getOwnershipStatus(currentUserId),
      sheetsService.getAllOwnershipStatus(),
    ]);

    setCards(cardsData);
    setUsers(usersData);
    setOwnership(ownershipData);
    setAllOwnership(allOwnershipData);
  };

  const handleToggleNotOwned = async (cardId: string, notOwned: boolean) => {
    const newStatus: OwnershipStatus = {
      cardId,
      userId: currentUserId,
      notOwned,
      tradeable: false,
    };

    const success = await sheetsService.updateOwnershipStatus(newStatus);
    if (success) {
      // 現在のユーザーの所持状況を更新
      setOwnership(prev => {
        const filtered = prev.filter(o => !(o.cardId === cardId && o.userId === currentUserId));
        return [...filtered, newStatus];
      });
      
      // 全ユーザーの所持状況も更新
      setAllOwnership(prev => {
        const filtered = prev.filter(o => !(o.cardId === cardId && o.userId === currentUserId));
        return [...filtered, newStatus];
      });
    }
  };

  const handleToggleTradeable = async (cardId: string, tradeable: boolean) => {
    const success = await sheetsService.updateTradeableStatus(cardId, currentUserId, tradeable);
    if (success) {
      // 現在のユーザーの所持状況を確認
      const existingStatus = ownership.find(o => o.cardId === cardId && o.userId === currentUserId);
      
      if (existingStatus) {
        // 既存のレコードがある場合は更新
        setOwnership(prev => 
          prev.map(o => 
            o.cardId === cardId && o.userId === currentUserId 
              ? { ...o, tradeable } 
              : o
          )
        );
        
        setAllOwnership(prev => 
          prev.map(o => 
            o.cardId === cardId && o.userId === currentUserId 
              ? { ...o, tradeable } 
              : o
          )
        );
      } else if (tradeable) {
        // 新規レコードの場合（所持していて交換可能にチェック）
        const newStatus: OwnershipStatus = {
          cardId,
          userId: currentUserId,
          notOwned: false,
          tradeable: true,
        };
        
        setOwnership(prev => [...prev, newStatus]);
        setAllOwnership(prev => [...prev, newStatus]);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">読み込み中...</div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="App">
        <header className="app-header">
          <h1>ポケポケ図鑑チェッカー</h1>
          <div className="header-controls">
            {isSignedIn && users.length > 0 && (
              <div className="user-selector">
                <label>ユーザー: </label>
                <select
                  value={currentUserId}
                  onChange={(e) => {
                    setCurrentUserId(e.target.value);
                    loadData();
                  }}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.id === currentUserId && '(あなた)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              className="sign-button"
              onClick={isSignedIn ? handleSignOut : handleSignIn}
            >
              {isSignedIn ? 'ログアウト' : 'Googleでログイン'}
            </button>
          </div>
        </header>

        <nav className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            カード一覧
          </button>
          <button
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            統計
          </button>
        </nav>

        <main className="main-content">
          {!isSignedIn ? (
            <div className="sign-in-prompt">
              <h2>ようこそ！</h2>
              <p>ポケポケ図鑑チェッカーを使用するには、Googleアカウントでログインしてください。</p>
              <button className="sign-in-button" onClick={handleSignIn}>
                Googleでログイン
              </button>
            </div>
          ) : activeTab === 'cards' ? (
            <CardList
              cards={cards}
              ownership={ownership}
              allOwnership={allOwnership}
              users={users}
              currentUserId={currentUserId}
              onToggleNotOwned={handleToggleNotOwned}
              onToggleTradeable={handleToggleTradeable}
            />
          ) : (
            <CollectionStats
              cards={cards}
              ownership={ownership}
              users={users}
              currentUserId={currentUserId}
            />
          )}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;