"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, User, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface LoginBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginBottomSheet({ isOpen, onClose, onSuccess }: LoginBottomSheetProps) {
  const [step, setStep] = useState<"auth" | "phone">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const login = useCartStore(state => state.login);
  const setAuth = useCartStore(state => state.setAuth);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setStep("auth");
      setEmail("");
      setPassword("");
      setPhone("");
      setCurrentUser(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = async () => {
    if (step === "phone" && currentUser) {
      await signOut(auth);
      setCurrentUser(null);
      setStep("auth");
      toast.error("Phone number is required. Signed out.");
    }
    onClose();
  };

  const checkPhoneAndProceed = async (user: User) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().phoneNumber) {
        const userData = userDoc.data();
        setAuth(true, user.uid, userData.phoneNumber, userData);
        login(userData.phoneNumber); // for backwards compatibility with user object
        
        // Force global state to update instantly
        useCartStore.setState({
          user: { uid: user.uid, ...userData } as any,
          isAuthLoading: false
        });

        toast.success("Logged in successfully!");
        onClose();
        if (userData.role === "admin") {
          router.push("/admin");
        }
        if (onSuccess) onSuccess();
      } else {
        setCurrentUser(user);
        setStep("phone");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error checking account details");
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await checkPhoneAndProceed(result.user);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || password.length < 6) {
      toast.error("Please enter a valid email and password (min 6 chars)");
      return;
    }
    setIsLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      await checkPhoneAndProceed(result.user);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (phone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      
      const profileData = {
        phoneNumber: fullPhone,
        email: currentUser.email || null,
        displayName: currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "User"),
        photoURL: currentUser.photoURL || null,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", currentUser.uid), profileData, { merge: true });
      
      setAuth(true, currentUser.uid, fullPhone, profileData);
      login(fullPhone);

      // Force global state to update instantly
      useCartStore.setState({
        user: { uid: currentUser.uid, ...profileData } as any,
        isAuthLoading: false
      });

      toast.success("Account created successfully!");
      onClose();
      if (profileData.role === "admin") {
        router.push("/admin");
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save phone number");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100] transition-opacity" onClick={handleCloseModal} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-2xl z-[101] animate-in slide-in-from-bottom-full duration-300 shadow-2xl overflow-hidden">
        
        {step === "auth" ? (
          <>
            <div className="bg-pink-50 relative p-6 border-b border-pink-100 flex flex-col items-center justify-center">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 p-1 text-gray-500 hover:bg-white/50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <span className="text-2xl">🎉</span>
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Login or Signup</h2>
              <p className="text-sm text-pink-600 font-bold mt-1">Enjoy ₹500 off on your first order</p>
            </div>
            
            <div className="p-6">
              <button 
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded font-bold text-sm tracking-wide flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-sm mb-6 disabled:opacity-70"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase">or</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="space-y-4 mb-6">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-3 outline-none text-sm font-bold focus:border-black transition-colors"
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-3 outline-none text-sm font-bold focus:border-black transition-colors"
                />
              </div>

              <button 
                onClick={handleEmailAuth}
                disabled={isLoading}
                className="w-full bg-pink-500 text-white py-4 rounded font-black text-sm uppercase tracking-widest flex items-center justify-center hover:bg-pink-600 transition active:scale-[0.98] shadow-md shadow-pink-200 disabled:opacity-70"
              >
                {isLoading ? "Please wait..." : (isSignUp ? "Sign Up with Email" : "Login with Email")}
              </button>
              
              <p className="text-center text-xs font-bold text-gray-500 mt-4 cursor-pointer hover:text-pink-600 transition-colors" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Already have an account? Log In" : "New to V-MART? Sign Up"}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white relative p-6 border-b border-gray-100 flex flex-col items-center justify-center">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Delivery Contact Details</h2>
              <p className="text-sm text-gray-500 font-bold mt-1 text-center">We need your phone number to deliver your orders successfully.</p>
            </div>

            <div className="p-6">
              <div className={`flex border rounded overflow-hidden mb-2 focus-within:border-black transition-colors bg-white ${phone.length > 0 && !/^[0-9]{10}$/.test(phone) ? 'border-red-500' : 'border-gray-300'}`}>
                <div className="px-4 py-3 bg-gray-50 border-r border-gray-300 text-gray-500 font-bold text-sm flex items-center">
                  +91
                </div>
                <input 
                  type="tel" 
                  placeholder="Mobile Number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 px-4 py-3 outline-none text-sm font-bold tracking-wide"
                />
              </div>
              
              {phone.length > 0 && !/^[0-9]{10}$/.test(phone) && (
                <p className="text-xs text-red-500 font-bold mb-4">Please enter a valid 10-digit mobile number</p>
              )}
              {!(phone.length > 0 && !/^[0-9]{10}$/.test(phone)) && <div className="mb-6"></div>}

              <button 
                onClick={handleSavePhone}
                disabled={isLoading || !/^[0-9]{10}$/.test(phone)}
                className="w-full bg-black text-white py-4 rounded font-black text-sm uppercase tracking-widest flex items-center justify-center hover:bg-gray-900 transition active:scale-[0.98] shadow-md disabled:opacity-70 disabled:bg-gray-400"
              >
                {isLoading ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
