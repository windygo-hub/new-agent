
import { LibraryItem, UserPersona, SellingPoint, ProductPhoto, StyleReference, User } from '../types';

const USER_SESSION_KEY = 'creative_studio_current_user';

/**
 * 字符转 ID 的安全方案，支持中文及特殊字符
 */
const generateSafeId = (str: string): string => {
  try {
    // 适配 UTF-8 字符的 Base64 方案，处理中文 ID 生成问题
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    )).substring(0, 8).toLowerCase();
  } catch (e) {
    // 极端情况下的降级哈希
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }
};

// 动态获取当前用户的前缀，确保数据按账号隔离
const getPrefix = () => {
  try {
    const userStr = localStorage.getItem(USER_SESSION_KEY);
    if (!userStr || userStr === 'undefined') return 'guest_';
    const user = JSON.parse(userStr);
    return user && user.id ? `${user.id}_` : 'guest_';
  } catch {
    return 'guest_';
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(getPrefix() + key, value);
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      alert('存储空间已满。请删除一些旧性灵感库内容或素材后再试。');
    }
  }
};

export const storageService = {
  // 用户管理
  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(USER_SESSION_KEY);
      if (!data || data === 'undefined') return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  login: (username: string): User => {
    const userId = generateSafeId(username);
    const user: User = { id: userId, username, lastLogin: Date.now() };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    return user;
  },
  logout: () => {
    localStorage.removeItem(USER_SESSION_KEY);
  },

  // 素材库
  getItems: (): LibraryItem[] => {
    const data = localStorage.getItem(getPrefix() + 'library');
    return data ? JSON.parse(data) : [];
  },
  saveItem: (item: Omit<LibraryItem, 'id' | 'createdAt'>): LibraryItem => {
    const items = storageService.getItems();
    const newItem: LibraryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    items.unshift(newItem);
    safeSetItem('library', JSON.stringify(items.slice(0, 30)));
    return newItem;
  },
  deleteItem: (id: string) => {
    const storageKey = getPrefix() + 'library';
    const rawData = localStorage.getItem(storageKey);
    if (!rawData) return;
    
    try {
      const items = JSON.parse(rawData);
      // 使用最稳妥的过滤方式
      const filteredItems = items.filter((i: any) => i.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filteredItems));
    } catch (e) {
      console.error("Storage delete error:", e);
    }
  },

  // 卖点库
  getSellingPoints: (): SellingPoint[] => {
    const data = localStorage.getItem(getPrefix() + 'usp');
    return data ? JSON.parse(data) : [
      { id: '1', text: '来自黄酒源头汉中' },
      { id: '2', text: '纯天然酿造，无添加' },
      { id: '3', text: '口感柔和，体感舒适' },
      { id: '4', text: '手工酿造300天' },
      { id: '5', text: '包装精美，送礼自饮皆不错' }
    ];
  },
  addSellingPoint: (text: string) => {
    const points = storageService.getSellingPoints();
    points.push({ id: Math.random().toString(36).substr(2, 9), text });
    safeSetItem('usp', JSON.stringify(points));
  },
  deleteSellingPoint: (id: string) => {
    const points = storageService.getSellingPoints().filter(p => p.id !== id);
    safeSetItem('usp', JSON.stringify(points));
  },

  // 产品图库
  getProductPhotos: (): ProductPhoto[] => {
    const data = localStorage.getItem(getPrefix() + 'products');
    return data ? JSON.parse(data) : [];
  },
  saveProductPhoto: (url: string) => {
    const photos = storageService.getProductPhotos();
    photos.unshift({ id: Math.random().toString(36).substr(2, 9), url });
    safeSetItem('products', JSON.stringify(photos.slice(0, 12)));
  },
  deleteProductPhoto: (id: string) => {
    const photos = storageService.getProductPhotos().filter(p => p.id !== id);
    safeSetItem('products', JSON.stringify(photos));
  },

  // 创意参考库
  getStyleReferences: (): StyleReference[] => {
    const data = localStorage.getItem(getPrefix() + 'style_refs');
    return data ? JSON.parse(data) : [];
  },
  saveStyleReference: (url: string) => {
    const refs = storageService.getStyleReferences();
    refs.unshift({ id: Math.random().toString(36).substr(2, 9), url });
    safeSetItem('style_refs', JSON.stringify(refs.slice(0, 8)));
  },
  deleteStyleReference: (id: string) => {
    const refs = storageService.getStyleReferences().filter(r => r.id !== id);
    safeSetItem('style_refs', JSON.stringify(refs));
  },

  // 人设库
  getSavedPersonas: (): UserPersona[] => {
    const data = localStorage.getItem(getPrefix() + 'personas');
    return data ? JSON.parse(data) : [];
  },
  savePersona: (persona: UserPersona): UserPersona => {
    const personas = storageService.getSavedPersonas();
    const newPersona = {
      ...persona,
      id: persona.id || Math.random().toString(36).substr(2, 9),
      isSystem: false
    };
    const index = personas.findIndex(p => p.id === newPersona.id);
    if (index >= 0) personas[index] = newPersona;
    else personas.unshift(newPersona);
    safeSetItem('personas', JSON.stringify(personas));
    return newPersona;
  },
  deletePersona: (id: string) => {
    const personas = storageService.getSavedPersonas().filter(p => p.id !== id);
    safeSetItem('personas', JSON.stringify(personas));
  }
};
