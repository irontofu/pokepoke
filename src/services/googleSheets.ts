import { Card, User, OwnershipStatus } from '../types';

declare const google: any;
declare const gapi: any;

const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID || '';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
// スコープの設定（スプレッドシート + ユーザー情報）
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private sheets: any;
  private tokenClient: any;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            // APIキーは不要（OAuth使用のため）
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          this.sheets = gapi.client.sheets;
          
          // Google Identity Services の初期化
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
              if (response.error) {
                console.error('Token initialization error:', response);
                reject(response);
                return;
              }
              this.accessToken = response.access_token;
              resolve(true);
            },
            error_callback: (error: any) => {
              console.error('OAuth error:', error);
              reject(error);
            },
          });
          
          // 既存のトークンがあるかチェック
          const savedToken = localStorage.getItem('google_access_token');
          if (savedToken) {
            this.accessToken = savedToken;
            gapi.client.setToken({ access_token: savedToken });
            resolve(true);
          } else {
            resolve(true);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async signIn() {
    return new Promise((resolve, reject) => {
      if (this.accessToken) {
        resolve(true);
        return;
      }
      
      this.tokenClient.callback = async (response: any) => {
        if (response.error) {
          reject(response);
          return;
        }
        this.accessToken = response.access_token;
        localStorage.setItem('google_access_token', response.access_token);
        gapi.client.setToken({ access_token: response.access_token });
        
        // ユーザー情報を取得して登録・更新
        try {
          await this.updateCurrentUser();
          resolve(true);
        } catch (error) {
          console.error('Error updating user:', error);
          resolve(true); // ユーザー更新に失敗しても続行
        }
      };
      
      this.tokenClient.requestAccessToken();
    });
  }

  signOut() {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken, () => {
        this.accessToken = null;
        localStorage.removeItem('google_access_token');
        gapi.client.setToken(null);
      });
    }
  }

  isSignedIn(): boolean {
    return !!this.accessToken;
  }

  async getUserInfo(): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  async updateCurrentUser(): Promise<User | null> {
    try {
      const userInfo = await this.getUserInfo();
      if (!userInfo || !userInfo.email) {
        return null;
      }

      // 既存のユーザーを確認
      const existingUsers = await this.getUsers();
      const existingUser = existingUsers.find(u => u.email === userInfo.email);

      if (existingUser) {
        // 既存ユーザーの情報を更新（名前が変更されている場合）
        if (existingUser.name !== userInfo.name) {
          await this.updateUserName(existingUser.id, userInfo.name);
          return { ...existingUser, name: userInfo.name };
        }
        return existingUser;
      } else {
        // 新規ユーザーを登録
        const newUser = await this.createUser(userInfo.email, userInfo.name);
        return newUser;
      }
    } catch (error) {
      console.error('Error updating current user:', error);
      return null;
    }
  }

  async createUser(email: string, name: string): Promise<User> {
    try {
      const users = await this.getUsers();
      const newId = `user${users.length + 1}`;
      
      const values = [[newId, name, email]];
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Users!A:C',
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });

      return { id: newId, name, email };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserName(userId: string, newName: string): Promise<boolean> {
    try {
      // ユーザーリストを取得して行番号を特定
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Users!A:C',
      });

      const rows = response.result.values || [];
      let rowIndex = -1;
      
      for (let i = 1; i < rows.length; i++) { // ヘッダーをスキップ
        if (rows[i][0] === userId) {
          rowIndex = i + 1; // シートの行番号は1から始まる
          break;
        }
      }

      if (rowIndex === -1) {
        return false;
      }

      // 名前を更新
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Users!B${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[newName]] },
      });

      return true;
    } catch (error) {
      console.error('Error updating user name:', error);
      return false;
    }
  }

  async getCards(): Promise<Card[]> {
    try {
      if (!this.isSignedIn()) {
        await this.signIn();
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Cards!A2:F',
      });

      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        number: row[1],
        name: row[2],
        rarity: row[3],
        series: row[4],
        imageUrl: row[5],
      }));
    } catch (error: any) {
      console.error('Error fetching cards:', error);
      if (error.status === 401) {
        // トークンが無効な場合は再認証
        this.accessToken = null;
        localStorage.removeItem('google_access_token');
        await this.signIn();
        return this.getCards(); // リトライ
      }
      return [];
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      if (!this.isSignedIn()) {
        await this.signIn();
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Users!A2:C',
      });

      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        name: row[1],
        email: row[2],
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getOwnershipStatus(userId: string): Promise<OwnershipStatus[]> {
    try {
      if (!this.isSignedIn()) {
        await this.signIn();
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Ownership!A2:E',
      });

      const rows = response.result.values || [];
      return rows
        .filter((row: any[]) => row[1] === userId)
        .map((row: any[]) => ({
          cardId: row[0],
          userId: row[1],
          owned: row[2] === 'TRUE',
          quantity: parseInt(row[3]) || 0,
          notes: row[4],
        }));
    } catch (error) {
      console.error('Error fetching ownership status:', error);
      return [];
    }
  }

  async getAllOwnershipStatus(): Promise<OwnershipStatus[]> {
    try {
      if (!this.isSignedIn()) {
        await this.signIn();
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Ownership!A2:E',
      });

      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        cardId: row[0],
        userId: row[1],
        owned: row[2] === 'TRUE',
        quantity: parseInt(row[3]) || 0,
        notes: row[4],
      }));
    } catch (error) {
      console.error('Error fetching all ownership status:', error);
      return [];
    }
  }

  async updateOwnershipStatus(status: OwnershipStatus): Promise<boolean> {
    try {
      if (!this.isSignedIn()) {
        await this.signIn();
      }
      
      // まず既存のデータを取得
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Ownership!A2:E',
      });
      
      const rows = response.result.values || [];
      const existingRowIndex = rows.findIndex(
        (row: any[]) => row[0] === status.cardId && row[1] === status.userId
      );
      
      if (!status.owned) {
        // owned=false（所持している）の場合、既存の行があれば削除
        if (existingRowIndex !== -1) {
          // スプレッドシートの行を詰めるため、全データを再書き込み
          const newRows = rows.filter((_: any, index: number) => index !== existingRowIndex);
          
          // まず全体をクリア
          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Ownership!A2:E1000',
          });
          
          // 新しいデータを書き込み
          if (newRows.length > 0) {
            await this.sheets.spreadsheets.values.update({
              spreadsheetId: SPREADSHEET_ID,
              range: 'Ownership!A2:E',
              valueInputOption: 'USER_ENTERED',
              resource: { values: newRows },
            });
          }
        }
        // owned=falseの場合は何も追加しない
      } else {
        // owned=true（未持）の場合
        if (existingRowIndex === -1) {
          // 新規追加
          const values = [[
            status.cardId,
            status.userId,
            'TRUE',
            status.quantity || 0,
            status.notes || '',
          ]];
          
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Ownership!A:E',
            valueInputOption: 'USER_ENTERED',
            resource: { values },
          });
        }
        // 既に存在する場合は何もしない
      }

      return true;
    } catch (error) {
      console.error('Error updating ownership status:', error);
      return false;
    }
  }
}