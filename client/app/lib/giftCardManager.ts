// src/lib/giftCardManager.ts
export interface GiftCard {
  code: string;
  balance: number;
  createdAt: string;
  expiresAt: string;
}

export interface GiftCardOrder {
  id: string;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  amount: number;
  message: string;
  deliveryDate: string;
  designId: string;
  status: 'pending' | 'sent' | 'redeemed' | 'expired';
  code: string;
  createdAt: string;
}

export class GiftCardManager {
  private static instance: GiftCardManager;
  private listeners: (() => void)[] = [];

  static getInstance(): GiftCardManager {
    if (!this.instance) {
      this.instance = new GiftCardManager();
    }
    return this.instance;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  generateGiftCardCode(): string {
    return 'GIFT-' + Math.random().toString(36).substring(2, 10).toUpperCase() + 
           '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  purchaseGiftCard(order: Omit<GiftCardOrder, 'id' | 'code' | 'status' | 'createdAt'>): GiftCardOrder {
    const newOrder: GiftCardOrder = {
      ...order,
      id: Date.now().toString(),
      code: this.generateGiftCardCode(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const orders = this.getOrders();
    orders.push(newOrder);
    localStorage.setItem('giftCardOrders', JSON.stringify(orders));
    
    this.addGiftCardBalance(newOrder.code, order.amount);
    this.notify();
    
    return newOrder;
  }

  getOrders(): GiftCardOrder[] {
    const orders = localStorage.getItem('giftCardOrders');
    return orders ? JSON.parse(orders) : [];
  }

  getGiftCards(): GiftCard[] {
    const cards = localStorage.getItem('giftCards');
    return cards ? JSON.parse(cards) : [];
  }

  addGiftCardBalance(code: string, amount: number): void {
    const cards = this.getGiftCards();
    const existingCard = cards.find(c => c.code === code);
    
    if (existingCard) {
      existingCard.balance += amount;
    } else {
      cards.push({
        code,
        balance: amount,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    
    localStorage.setItem('giftCards', JSON.stringify(cards));
  }

  redeemGiftCard(code: string, amount: number): boolean {
    const cards = this.getGiftCards();
    const card = cards.find(c => c.code === code);
    
    if (!card) return false;
    if (card.balance < amount) return false;
    if (new Date(card.expiresAt) < new Date()) return false;
    
    card.balance -= amount;
    localStorage.setItem('giftCards', JSON.stringify(cards));
    
    const orders = this.getOrders();
    const order = orders.find(o => o.code === code);
    if (order && card.balance === 0) {
      order.status = 'redeemed';
      localStorage.setItem('giftCardOrders', JSON.stringify(orders));
    }
    
    this.notify();
    return true;
  }

  getBalance(code: string): number {
    const cards = this.getGiftCards();
    const card = cards.find(c => c.code === code);
    return card ? card.balance : 0;
  }

  validateGiftCard(code: string): { valid: boolean; balance: number; message: string } {
    const balance = this.getBalance(code);
    
    if (balance <= 0) {
      return { valid: false, balance: 0, message: 'Gift card has no balance' };
    }
    
    const cards = this.getGiftCards();
    const card = cards.find(c => c.code === code);
    
    if (card && new Date(card.expiresAt) < new Date()) {
      return { valid: false, balance: 0, message: 'Gift card has expired' };
    }
    
    return { valid: true, balance, message: `$${balance.toFixed(2)} available` };
  }

  applyGiftCardToCart(code: string, cartTotal: number): { success: boolean; newTotal: number; message: string } {
    const validation = this.validateGiftCard(code);
    
    if (!validation.valid) {
      return { success: false, newTotal: cartTotal, message: validation.message };
    }
    
    const amountToUse = Math.min(validation.balance, cartTotal);
    const success = this.redeemGiftCard(code, amountToUse);
    
    if (success) {
      return { 
        success: true, 
        newTotal: cartTotal - amountToUse, 
        message: `$${amountToUse.toFixed(2)} applied from gift card` 
      };
    }
    
    return { success: false, newTotal: cartTotal, message: 'Failed to apply gift card' };
  }
}