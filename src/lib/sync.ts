import { auth, db } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  writeBatch, 
  serverTimestamp,
  increment 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useCartStore, CartItem, Address } from "@/store/cartStore";

let unsubscribeAuth: any = null;

const sanitizeForFirestore = (data: any) => JSON.parse(JSON.stringify(data));

export function initializeFirebaseSync() {
  if (unsubscribeAuth) return;

  unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    const store = useCartStore.getState();
    
    if (user) {
      // Listen to the profile from Firestore in real-time
      const userRef = doc(db, "users", user.uid);
      try {
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            useCartStore.setState({ 
              isAuthenticated: true,
              uid: user.uid,
              user: { 
                uid: user.uid, 
                ...userData, 
                addresses: userData.addresses || [] 
              } as any
            });
          } else {
            store.setAuth(true, user.uid, user.phoneNumber || "");
          }
        });
      } catch (err) {
        console.error("Failed to fetch user profile during hydration:", err);
        store.setAuth(true, user.uid, user.phoneNumber || "");
      }
      
      // Sync remaining data (cart, wishlist, addresses)
      await syncDownFromFirebase(user.uid);
    } else {
      store.setAuth(false, null, "");
      // Note: we don't automatically clear cart on logout per instructions, 
      // but usually you would. We'll leave it as is.
    }
    
    store.setAuthLoading(false);
  });

  // Listen to local store changes and sync UP to Firebase
  useCartStore.subscribe((state, prevState) => {
    if (!state.uid) return;

    // Check if user just logged in
    const justLoggedIn = !prevState.uid && state.uid;

    // Wishlist Sync
    if (state.wishlistItems !== prevState.wishlistItems || (justLoggedIn && state.wishlistItems.length > 0)) {
      setDoc(doc(db, "users", state.uid), { wishlist: sanitizeForFirestore(state.wishlistItems) }, { merge: true }).catch(console.error);
    }

    // Cart Sync
    if (state.items !== prevState.items || (justLoggedIn && state.items.length > 0)) {
      setDoc(doc(db, "users", state.uid), { cart: sanitizeForFirestore(state.items) }, { merge: true }).catch(console.error);
    }

    // Addresses Sync
    if (state.savedAddresses !== prevState.savedAddresses || (justLoggedIn && state.savedAddresses.length > 0)) {
      syncAddressesUp(state.uid, sanitizeForFirestore(state.savedAddresses));
    }
  });
}

async function syncAddressesUp(uid: string, addresses: Address[]) {
  const batch = writeBatch(db);
  const addrRef = collection(db, "users", uid, "addresses");
  
  // Basic approach: write all addresses (assuming it's a small array)
  addresses.forEach(addr => {
    batch.set(doc(addrRef, addr.id), addr);
  });
  
  try {
    await batch.commit();
  } catch(e) {
    console.error("Error syncing addresses up", e);
  }
}

async function syncDownFromFirebase(uid: string) {
  const store = useCartStore.getState();
  
  try {
    // 1. Fetch user doc for wishlist and cart
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      store.setAuth(true, uid, data.phoneNumber || "", data);
      
      if (data.wishlist) store.setWishlist(data.wishlist);
      
      if (data.cart) {
        const cloudCart: CartItem[] = data.cart;
        const localCart = store.items;
        const mergedCart = [...cloudCart];
        
        localCart.forEach(localItem => {
          const existing = mergedCart.find(c => c.id === localItem.id);
          if (existing) {
            existing.quantity += localItem.quantity;
          } else {
            mergedCart.push(localItem);
          }
        });
        
        store.setCart(mergedCart);
      } else if (store.items.length > 0) {
        // Trigger a force sync up if there was no cloud cart but we have local items
        setDoc(userDocRef, { cart: sanitizeForFirestore(store.items) }, { merge: true }).catch(console.error);
      }
    }
    
    // 2. Fetch addresses
    const addrRef = collection(db, "users", uid, "addresses");
    const addrSnap = await getDocs(addrRef);
    const addresses: Address[] = [];
    addrSnap.forEach(doc => {
      addresses.push(doc.data() as Address);
    });
    
    if (addresses.length > 0) {
      store.setAddresses(addresses);
    }
  } catch (error) {
    console.error("Error syncing down from Firebase", error);
  }
}

export async function createOrderInFirebase(uid: string, orderData: any) {
  const batch = writeBatch(db);
  const newOrderRef = doc(collection(db, "orders"));
  
  batch.set(newOrderRef, sanitizeForFirestore({
    ...orderData,
    userId: uid,
    createdAt: serverTimestamp()
  }));

  if (orderData.items && Array.isArray(orderData.items)) {
    orderData.items.forEach((item: any) => {
      const productRef = doc(db, "products", item.productId);
      batch.set(productRef, {
        stock: {
          [item.size]: increment(-item.quantity)
        }
      }, { merge: true });
    });
  }

  await batch.commit();
}
