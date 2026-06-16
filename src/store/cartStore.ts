import { create } from 'zustand';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export interface Address {
  id: string;
  title?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number | string; // Made optional to prevent deduplication errors
  lon?: number | string; // Made optional to prevent deduplication errors
  street?: string;
  name?: string;
  phone?: string;
}

interface CartState {
  items: CartItem[];
  userLocation: { lat: number; lon: number } | null;
  deliveryLocation: string | null;
  deliveryFee: number | null;
  isOutOfZone: boolean;
  saveGuestAddress: boolean;
  wishlistItems: string[];
  searchCategory: string;
  selectedPaymentMethod: string | null;

  isAuthenticated: boolean;
  isAuthLoading: boolean;
  uid: string | null;
  user: { 
    name: string; 
    phone: string; 
    role: string; 
    displayName?: string; 
    phoneNumber?: string; 
    email?: string;
    uid?: string;
    addresses?: Address[];
  } | null;
  savedAddresses: Address[];
  activeDeliveryAddress: Address | null;
  
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setUserLocation: (lat: number, lon: number) => void;
  setDeliveryLocation: (location: string) => void;
  setDeliveryDetails: (fee: number, isOutOfZone: boolean) => void;
  setSaveGuestAddress: (save: boolean) => void;
  setSelectedPaymentMethod: (method: string) => void;
  clearCart: () => void;
  
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => boolean;
  setSearchCategory: (category: string) => void;

  login: (phone: string) => void;
  logout: () => void;
  setAuth: (isAuthenticated: boolean, uid: string | null, phone: string, additionalData?: any) => void;
  setAuthLoading: (isLoading: boolean) => void;
  setWishlist: (items: string[]) => void;
  setCart: (items: CartItem[]) => void;
  setAddresses: (addresses: Address[]) => void;

  addAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  setActiveDeliveryAddress: (address: Address | null) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  userLocation: null,
  deliveryLocation: null,
  deliveryFee: null,
  isOutOfZone: false,
  saveGuestAddress: true,
  wishlistItems: [],
  searchCategory: "All",
  selectedPaymentMethod: null,
  isAuthenticated: false,
  isAuthLoading: true,
  uid: null,
  user: null,
  savedAddresses: [],
  activeDeliveryAddress: null,

  addAddress: (address) => set((state) => ({ savedAddresses: [...state.savedAddresses, address] })),
  removeAddress: (id) => set((state) => ({ savedAddresses: state.savedAddresses.filter(a => a.id !== id) })),
  setActiveDeliveryAddress: (address) => set({ activeDeliveryAddress: address }),

  addItem: (newItem) => set((state) => {
    const existingItem = state.items.find(
      (item) => item.productId === newItem.productId && item.size === newItem.size && item.color === newItem.color
    );
    if (existingItem) {
      return {
        items: state.items.map((item) =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      };
    }
    const id = `${newItem.productId}-${newItem.size}-${newItem.color}`;
    return { items: [...state.items, { ...newItem, id, quantity: 1 }] };
  }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),

  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
  })),

  setUserLocation: (lat, lon) => set({ userLocation: { lat, lon } }),
  
  setDeliveryLocation: (location) => set({ deliveryLocation: location }),

  setDeliveryDetails: (fee, isOutOfZone) => set({ deliveryFee: fee, isOutOfZone }),

  setSaveGuestAddress: (save) => set({ saveGuestAddress: save }),
  
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

  clearCart: () => set({ items: [], deliveryLocation: null, deliveryFee: null, isOutOfZone: false, selectedPaymentMethod: null }),

  addToWishlist: (productId) => set((state) => {
    if (state.wishlistItems.includes(productId)) return state;
    return { wishlistItems: [...state.wishlistItems, productId] };
  }),

  removeFromWishlist: (productId) => set((state) => ({
    wishlistItems: state.wishlistItems.filter(id => id !== productId)
  })),

  toggleWishlist: (productId) => {
    const isWished = get().wishlistItems.includes(productId);
    if (isWished) {
      set((state) => ({ wishlistItems: state.wishlistItems.filter(id => id !== productId) }));
      return false;
    } else {
      set((state) => ({ wishlistItems: [...state.wishlistItems, productId] }));
      return true;
    }
  },

  setSearchCategory: (category) => set({ searchCategory: category }),

  login: (phone) => set({ 
    isAuthenticated: true, 
    user: { name: "Bhanu", phone, role: "Admin" } 
  }),

  logout: () => set({ 
    isAuthenticated: false, 
    uid: null,
    user: null 
  }),

  setAuthLoading: (isLoading) => set({ isAuthLoading: isLoading }),

  setAuth: (isAuthenticated, uid, phone, additionalData) => set((state) => ({
    isAuthenticated,
    uid,
    user: isAuthenticated ? { 
      name: additionalData?.displayName || state.user?.name || "Bhanu", 
      phone: additionalData?.phoneNumber || phone, 
      role: additionalData?.role || "user",
      displayName: additionalData?.displayName,
      phoneNumber: additionalData?.phoneNumber || phone,
      email: additionalData?.email,
    } : null
  })),

  setWishlist: (items) => set({ wishlistItems: items }),
  setCart: (items) => set({ items }),
  setAddresses: (addresses) => set({ savedAddresses: addresses })
}));
