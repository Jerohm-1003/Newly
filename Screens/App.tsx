import React, { useState, useEffect } from "react";
import "../firebase/firebaseConfig";
import { auth, firestore } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

import CartScreen from "./CartScreen";
import HomeScreen from "./Home";
import FurnitureScreen from "./FurnitureScreen";
import LivingRoomScreen from "./LRf";
import BRoomScreen from "./BRf";
import DRoomScreen from "./Dr";
import ShopfurScreen from "./FURARd";
import BRoomtScreen from "./BRFt";
import DRoomtScreen from "./Drt";
import DRScreen from "./Dr";
import BRScreen from "./BRf";
import LRegScreen from "./lreg";
import Profile from "./Profile";
import Inbox from "./inbox";
import NewlyUinfo from "./newlyUinfo";
import ProfileSetupScreen from "./ProfileSetupScreen";
import FurnitureUploadScreen from "./UploadF";
import AdminDashboardScreen from "./adminDashboard";
import OpenAR from "./OpenAR";
import IntroFlow from "./newlyUinfo";
import ProductDetails from "./ProductDetails";
import SellerPart from "./SellerPart";
import SettingsProfile from "./ProfileSettings";
import OrderHistoryScreen from "./OrderHistoryScreen";
import SettingsScreen from "./ProfileSettings";
import ProfileSettings from "./ProfileSettings";

export type Screen =
  | "loading"
  | "home"
  | "shopfur"
  | "ar"
  | "cart"
  | "Chair"
  | "Sofa"
  | "TVStand"
  | "profile"
  | "inbox"
  | "furniture"
  | "livingroom"
  | "bedroom"
  | "diningroom"
  | "Desks"
  | "Wardrobe"
  | "Bed"
  | "DiningTable"
  | "Cabinet"
  | "DiningChair"
  | "broomt"
  | "droomt"
  | "lreg"
  | "intro"
  | "profileSetup"
  | "UploadF"
  | "adminDashb"
  | "OpenAR"
  | "productDetails"
  | "SellerPart"
  | "orderHistory"
  | "settings";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const App = () => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [arUri, setArUri] = useState<string>("");
  const [showIntro, setShowIntro] = useState(true);
  const [screenParams, setScreenParams] = useState<any>(null);

  // 🔄 Fetch cart on user login
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const cartRef = doc(firestore, "carts", user.uid);
        const docSnap = await getDoc(cartRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCartItems(data.items || []);
        }
      } else {
        setCartItems([]); // 🔥 Clear cart when logged out
      }
    });

    return () => unsubscribe();
  }, []);

  // 🛒 Sync to Firestore
  const syncCartToFirestore = async (items: CartItem[]) => {
    const user = auth.currentUser;
    if (!user) return;
    const cartRef = doc(firestore, "carts", user.uid);
    await setDoc(cartRef, { items });
  };

  const addToCart = (newItem: CartItem) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to add items to your cart.");
      setScreen("lreg"); // 👈 or your login/register screen
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      const updated = existing
        ? prev.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { ...newItem, quantity: 1 }];

      syncCartToFirestore(updated);
      return updated;
    });
  };

  const incrementItem = (id: string) => {
    setCartItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      );
      syncCartToFirestore(updated);
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      syncCartToFirestore(updated);
      return updated;
    });
  };

  const totalPrice = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const goToScreen = (target: Screen, params?: any) => {
    if (target === "ar" && params?.uri) {
      setArUri(params.uri);
    }
    setScreenParams(params ?? null);
    setScreen(target);
  };

  if (screen === "adminDashb")
    return <AdminDashboardScreen goToScreen={goToScreen} />;

  if (screen === "intro") return <IntroFlow onDone={() => setScreen("home")} />;

  if (screen === "productDetails" && screenParams?.product) {
    return (
      <ProductDetails
        product={screenParams.product}
        goToScreen={goToScreen}
        addToCart={addToCart}
      />
    );
  }

  if (screen === "UploadF")
    return (
      <FurnitureUploadScreen
        goBack={() => setScreen("home")}
        goToScreen={goToScreen}
      />
    );

  if (screen === "OpenAR")
    return <OpenAR goBack={() => setScreen("home")} goToScreen={goToScreen} />;

  if (screen === "lreg") return <LRegScreen goToScreen={goToScreen} />;

  if (screen === "profileSetup" && screenParams)
    return (
      <ProfileSetupScreen
        goToScreen={goToScreen}
        route={{ params: screenParams }}
      />
    );

  if (screen === "home")
    return (
      <HomeScreen
        onCart={() => setScreen("cart")}
        onEnterShop={() => setScreen("shopfur")}
        goToScreen={goToScreen}
      />
    );

  if (["Chair", "Sofa", "TVStand"].includes(screen))
    return (
      <ShopfurScreen
        category={screen as "Chair" | "Sofa" | "TVStand"}
        goToScreen={goToScreen}
        addToCart={(item) => addToCart({ ...item, quantity: 1 })}
      />
    );

  const decrementItem = (id: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };
  const clearCart = () => setCartItems([]);

  const currentUser = auth.currentUser;

  if (screen === "cart")
    return (
      <CartScreen
        userId={currentUser ? currentUser.uid : "guest"}
        cartItems={cartItems}
        onBack={() => setScreen("home")}
        onIncrement={incrementItem}
        onDecrement={decrementItem} // 👈 missing piece
        onRemove={removeItem}
        total={totalPrice()}
        onClearCart={clearCart} // <-- pass it
      />
    );

  if (screen === "orderHistory")
    return (
      <OrderHistoryScreen
        userId={currentUser ? currentUser.uid : "guest"}
        goBack={() => setScreen("home")}
      />
    );

  if (screen === "furniture")
    return (
      <FurnitureScreen
        goBack={() => setScreen("home")}
        goToScreen={goToScreen}
      />
    );

  if (screen === "livingroom")
    return (
      <LivingRoomScreen
        goBack={() => setScreen("furniture")}
        goToScreen={goToScreen}
        // ❌ Remove these
        // addToCart={(item) => addToCart({ ...item, quantity: 1 })}
        // category="Sofa"
      />
    );

  if (screen === "broomt")
    return (
      <BRoomtScreen
        goBack={() => setScreen("furniture")}
        goToScreen={goToScreen}
      />
    );

  if (screen === "droomt")
    return (
      <DRoomtScreen
        goBack={() => setScreen("furniture")}
        goToScreen={goToScreen}
      />
    );

  if (screen === "SellerPart")
    return (
      <SellerPart goBack={() => setScreen("home")} goToScreen={goToScreen} />
    );

  if (["Desks", "Wardrobe", "Bed"].includes(screen))
    return (
      <BRScreen
        category={screen as "Desks" | "Wardrobe" | "Bed"}
        goToScreen={goToScreen}
        addToCart={(item) => addToCart({ ...item, quantity: 1 })}
      />
    );

  if (["DiningChair", "Cabinet", "DiningTable"].includes(screen))
    return (
      <DRScreen
        category={screen as "DiningChair" | "Cabinet" | "DiningTable"}
        goToScreen={goToScreen}
        addToCart={(item) => addToCart({ ...item, quantity: 1 })}
      />
    );

  if (screen === "profile")
    return <Profile goToScreen={goToScreen} goBack={() => setScreen("home")} />;

  if (screen === "inbox") {
    return <Inbox goBack={() => setScreen("home")} />; // ✅ gamit Inbox, hindi HomeScreen
  }
  if (screen === "settings") {
    return <SettingsScreen goBack={() => setScreen("home")} />; // ✅ gamit Inbox, hindi HomeScreen
  }

  return null;
};

export default App;
function alert(arg0: string) {
  throw new Error("Function not implemented.");
}
