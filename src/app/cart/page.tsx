"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, MapPin, AlertCircle, Navigation, QrCode, CreditCard, Banknote, ShoppingBag } from "lucide-react";
import { useCartStore, Address } from "@/store/cartStore";
import { calculateDistance, calculateDeliveryFee } from "@/lib/geolocation";
import { LocationBottomSheet } from "@/components/LocationBottomSheet";
import { LoginBottomSheet } from "@/components/LoginBottomSheet";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createOrderInFirebase } from "@/lib/sync";
import Script from "next/script";

export default function CartPage() {
  const router = useRouter();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    deliveryFee, 
    isOutOfZone, 
    setDeliveryDetails, 
    userLocation, 
    setUserLocation,
    deliveryLocation,
    setDeliveryLocation,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isAuthenticated,
    isAuthLoading,
    uid,
    clearCart,
    savedAddresses,
    saveGuestAddress,
    addAddress,
    activeDeliveryAddress,
    setActiveDeliveryAddress,
    user
  } = useCartStore();

  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const rawSubtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const safeTotalMRP = Number(rawSubtotal) || 0;
  let calculatedShipping = (deliveryFee !== null && !isOutOfZone) ? (Number(deliveryFee) || 0) : 0;
  
  if (isNaN(calculatedShipping) || calculatedShipping === undefined) {
      calculatedShipping = safeTotalMRP > 500 ? 0 : 50; 
  }
  
  const finalTotalAmount = safeTotalMRP + calculatedShipping;

  // Hydrate global address selection if missing
  useEffect(() => {
    if (!activeDeliveryAddress && user?.addresses && user.addresses.length > 0) {
      setActiveDeliveryAddress(user.addresses[0]);
    }
  }, [activeDeliveryAddress, user?.addresses, setActiveDeliveryAddress]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !deliveryLocation) {
      if (savedAddresses.length > 0) {
        const address = savedAddresses[0];
        if (address.lat !== undefined && address.lon !== undefined) {
          setUserLocation(Number(address.lat), Number(address.lon));
        }
        setDeliveryLocation(`${address.title} - ${address.pincode}`);
        setActiveDeliveryAddress(address);
        
        if (address.lat !== undefined && address.lon !== undefined) {
          const storeLat = parseFloat(process.env.NEXT_PUBLIC_STORE_LAT || "17.3850");
          const storeLon = parseFloat(process.env.NEXT_PUBLIC_STORE_LON || "78.4867");
          const distance = calculateDistance(Number(address.lat), Number(address.lon), storeLat, storeLon);
          const outOfZone = distance > 5;
          const fee = outOfZone ? 0 : Math.round(distance * 15);
          setDeliveryDetails(fee, outOfZone);
        }
      }
    }
  }, [isAuthenticated, isAuthLoading, savedAddresses, activeDeliveryAddress, setDeliveryDetails, setDeliveryLocation, setUserLocation, setActiveDeliveryAddress]);

  const handleDetectLocation = (address: any) => {
    setGeoError(null);
    setUserLocation(address.lat, address.lon);
    setDeliveryLocation(`${address.title} - ${address.pincode}`);

    const storeLat = parseFloat(process.env.NEXT_PUBLIC_STORE_LAT || "17.3850");
    const storeLon = parseFloat(process.env.NEXT_PUBLIC_STORE_LON || "78.4867");

    const distance = calculateDistance(address.lat, address.lon, storeLat, storeLon);
    const { fee, valid } = calculateDeliveryFee(distance);

    setDeliveryDetails(fee, !valid);
    
    if (!valid) {
      toast.error(`Out of Delivery Zone (${distance.toFixed(1)} km away)`);
    } else {
      toast.success("Delivery location updated!");
    }
  };

  const handlePincodeCheck = (pincode?: string) => {
    if (pincode) {
      setDeliveryLocation(pincode);
      setActiveDeliveryAddress({
        id: "pincode-" + pincode,
        title: "Selected Pincode",
        addressLine: "Pincode based delivery",
        pincode: pincode,
        lat: 0,
        lon: 0
      });
      setDeliveryDetails(50, false); // Mock calculation
      toast.success(`Delivery available to ${pincode}`);
    }
  };

  const executeCheckout = async (currentUid?: string | null) => {
    const activeUid = currentUid || uid || useCartStore.getState().uid;
    if (!activeUid) return;

    if (!activeDeliveryAddress) {
      toast.error("Please add a delivery address first.");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (!finalTotalAmount || finalTotalAmount <= 0 || isNaN(finalTotalAmount)) {
      toast.error("Invalid cart amount. Please refresh.");
      return;
    }

    const grandTotal = finalTotalAmount;

    const orderData = {
      items,
      deliveryAddress: activeDeliveryAddress,
      paymentMethod: selectedPaymentMethod,
      subtotal: safeTotalMRP,
      deliveryFee: calculatedShipping,
      grandTotal,
      status: "Pending"
    };

    setIsPlacingOrder(true);
    let toastId;

    try {
      if (selectedPaymentMethod === "COD") {
        toastId = toast.loading("Placing order...");
        await createOrderInFirebase(activeUid, orderData);
        clearCart();
        toast.dismiss(toastId);
        toast.success("Order Placed Successfully!");
        router.push('/success');
      } else if (selectedPaymentMethod === "ONLINE") {
        toastId = toast.loading("Initializing secure payment...");
        try {
          const res = await fetch("/api/razorpay/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: grandTotal }),
          });
          const data = await res.json();
          if (!res.ok || !data.id) throw new Error(data.error || "Failed to create Razorpay order");
          toast.dismiss(toastId);
          
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
            amount: Math.round(grandTotal * 100),
            currency: "INR",
            name: "V-MART",
            description: "Order Checkout",
            order_id: data.id,
            handler: async function (response: any) {
              const verifyToast = toast.loading("Verifying payment...");
              try {
                const verifyRes = await fetch("/api/razorpay/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  await createOrderInFirebase(activeUid, { ...orderData, paymentStatus: "Paid" });
                  clearCart();
                  toast.dismiss(verifyToast);
                  toast.success("Payment Successful! Order Placed.");
                  router.push('/success');
                } else {
                  throw new Error("Payment verification failed");
                }
              } catch (err: any) {
                toast.dismiss(verifyToast);
                toast.error(err.message || "Payment verification failed");
                setIsPlacingOrder(false);
              }
            },
            prefill: {
              contact: useCartStore.getState().user?.phoneNumber || "",
            },
            theme: { color: "#ec4899" },
            modal: {
              ondismiss: function() {
                setIsPlacingOrder(false);
              }
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            toast.error(response.error.description || "Payment failed");
            setIsPlacingOrder(false);
          });
          rzp.open();
        } catch (error: any) {
          if (toastId) toast.dismiss(toastId);
          toast.error(error.message || "Failed to initialize payment");
          setIsPlacingOrder(false);
        }
      }
    } catch (error: any) {
      if (toastId) toast.dismiss(toastId);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      // In case of setTimeout, setIsPlacingOrder is handled inside the timeout callbacks.
      if (selectedPaymentMethod === "COD") {
        setIsPlacingOrder(false);
      }
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !uid) {
      setIsLoginModalOpen(true);
      return;
    }
    executeCheckout(uid);
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    
    // Magic Sync: Guest Address
    if (saveGuestAddress && deliveryLocation && userLocation) {
      const pincodeMatch = deliveryLocation.match(/\d{6}$/);
      const extractedPincode = pincodeMatch ? pincodeMatch[0] : "";
      
      const isDuplicate = savedAddresses.some(a => a.title === "Guest Address" && a.pincode === extractedPincode);
      if (!isDuplicate) {
        addAddress({
          id: "addr-" + Date.now(),
          title: "Guest Address",
          addressLine: deliveryLocation,
          pincode: extractedPincode,
          lat: userLocation.lat,
          lon: userLocation.lon
        });
      }
    }

    // Seamless Order Execution
    setTimeout(() => {
      const state = useCartStore.getState();
      if (state.uid) {
        executeCheckout(state.uid);
      }
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pt-6 pb-32">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="px-4 space-y-6 flex-1 overflow-y-auto">
        <h1 className="text-2xl font-black uppercase tracking-wide text-gray-900">Shopping Bag</h1>

        {isAuthLoading ? (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex gap-4 animate-pulse">
              <div className="w-20 h-24 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mt-4"></div>
              </div>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-gray-500 bg-white shadow-sm border border-gray-100 rounded p-6">
            <ShoppingBag className="w-16 h-16 mb-4 text-gray-200" strokeWidth={1} />
            <h2 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Your bag is feeling light</h2>
            <p className="text-sm font-medium text-gray-500 mb-8 text-center">There is nothing in your bag. Let's add some items.</p>
            <button onClick={() => router.push('/')} className="bg-black text-white px-8 py-3 rounded font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition active:scale-[0.98] shadow-md">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 bg-white p-4 shadow-sm border border-gray-100 rounded">
                  <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0 rounded overflow-hidden">
                    <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 uppercase">Size: {item.size} | Color: {item.color}</p>
                      <p className="text-sm font-black text-gray-900 mt-1">₹{item.price}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-3 py-1 text-gray-500 hover:text-black transition font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-500 hover:text-black transition font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Section */}
            <div className="bg-white p-4 shadow-sm border border-gray-100 rounded space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Delivery Location</h3>
              
              {!deliveryLocation && !geoError ? (
                <button
                  onClick={() => setIsLocationSheetOpen(true)}
                  className="w-full flex items-center justify-between border border-gray-300 p-4 rounded hover:border-black transition-colors text-left"
                >
                  <span className="text-sm font-bold text-gray-500">Select Delivery Location</span>
                  <span className="text-pink-600 font-bold text-xs uppercase tracking-wide">Change</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border border-gray-200 p-3 rounded bg-gray-50">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Deliver to</p>
                        {activeDeliveryAddress ? (
                          <>
                            <p className="font-semibold text-gray-900">{activeDeliveryAddress.title}</p>
                            <p className="text-sm text-gray-600">
                              {activeDeliveryAddress.addressLine}, {activeDeliveryAddress.pincode}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900">Current Location</p>
                            <p className="text-sm text-gray-500">Location detected automatically</p>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsLocationSheetOpen(true)}
                      className="text-pink-600 font-bold text-xs uppercase tracking-wide p-2 inline-block"
                    >
                      Change
                    </button>
                  </div>
                  
                  {isOutOfZone ? (
                    <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 text-sm border border-red-100 rounded">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p><strong>Out of Delivery Zone.</strong> Max distance is 5km.</p>
                    </div>
                  ) : null}
                </div>
              )}

              {geoError && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 text-sm rounded">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{geoError}</p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            {deliveryLocation && !isOutOfZone && (
              <div className="bg-white p-4 shadow-sm border border-gray-100 rounded space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Payment Method</h3>
                
                <div className="space-y-3">
                  {/* Pay Online (Razorpay) */}
                  <div 
                    onClick={() => setSelectedPaymentMethod("ONLINE")}
                    className={`border rounded p-4 cursor-pointer transition-all ${selectedPaymentMethod === "ONLINE" ? "border-pink-500 bg-pink-50/30" : "border-gray-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "ONLINE" ? "border-pink-500" : "border-gray-300"}`}>
                        {selectedPaymentMethod === "ONLINE" && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                      </div>
                      <CreditCard className="w-5 h-5 text-gray-700" />
                      <span className="text-sm font-bold text-gray-900">Pay Online (Cards, UPI, NetBanking)</span>
                    </div>
                  </div>



                  {/* COD */}
                  <div 
                    onClick={() => setSelectedPaymentMethod("COD")}
                    className={`border rounded p-4 cursor-pointer transition-all ${selectedPaymentMethod === "COD" ? "border-pink-500 bg-pink-50/30" : "border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "COD" ? "border-pink-500" : "border-gray-300"}`}>
                          {selectedPaymentMethod === "COD" && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                        </div>
                        <Banknote className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</span>
                      </div>
                    </div>
                    {selectedPaymentMethod === "COD" && (
                      <div className="mt-2 pl-7">
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Eligible for COD</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Receipt / Totals */}
            <div className="bg-white p-4 shadow-sm border border-gray-100 rounded space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Price Details</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total MRP</span>
                <span>₹{safeTotalMRP}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Platform Fee</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping Fee</span>
                <span>{deliveryFee !== null && !isOutOfZone ? `₹${deliveryFee}` : isOutOfZone ? "N/A" : "Pending"}</span>
              </div>
              <hr className="border-gray-100 my-2" />
              <div className="flex justify-between font-black text-gray-900 text-lg pt-1">
                <span>Total Amount</span>
                <span>
                  ₹{finalTotalAmount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Checkout Button */}
      {items.length > 0 && (
        <div className="fixed bottom-[64px] w-full max-w-md bg-white border-t border-gray-200 p-4 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleCheckout}
            disabled={!deliveryLocation || isOutOfZone || isPlacingOrder}
            className="w-full bg-pink-500 text-white py-4 text-sm tracking-widest uppercase font-black rounded shadow-md hover:bg-pink-600 transition active:scale-[0.98] disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPlacingOrder ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : isOutOfZone ? (
              "Out of Delivery Zone"
            ) : !deliveryLocation ? (
              "Select Location"
            ) : (
              "Place Order"
            )}
          </button>
        </div>
      )}

      <LocationBottomSheet 
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        onDetectLocation={handleDetectLocation}
        onCheck={handlePincodeCheck}
      />
      <LoginBottomSheet 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
