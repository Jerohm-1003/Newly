import React, { useState } from "react";
import "../firebase/firebaseConfig";
import { auth } from "../firebase/firebaseConfig";

import HomeScreen from "./Home";
import FurnitureScreen from "./FurnitureScreen";
import LivingRoomScreen from "./LRf";
import BRoomScreen from "./BRf";

import ShopfurScreen from "./FURARd";
import BRoomtScreen from "./BRFt";
import BRScreen from "./BRf";
import LRegScreen from "./lreg";
import Profile from "./Profile";
import Wishlist from "./wishlist";
import IntroFlow from "./newlyUinfo";

import FurnitureUploadScreen from "./UploadF";
import AdminDashboardScreen from "./adminDashboard";
import ProductDetails from "./ProductDetails";

import SettingsScreen from "./ProfileSettings";
import ProfileSetupScreen from "./ProfileSetupScreen";
import SellerPart from "./SellerPart";
import Inbox from "./inbox";

import OfficeScreent from "./Office";
import Of from "./Of";

export type Screen =
  | "loading"
  | "home"
  | "shopfur"
  | "ar"
  | "Chair"
  | "Sofa"
  | "Inbox"
  | "TVStand"
  | "profile"
  | "Wishlist"
  | "furniture"
  | "livingroom"
  | "bedroom"
  | "Desks"
  | "Wardrobe"
  | "Bed"
  | "Cabinet"
  | "broomt"
  | "lreg"
  | "intro"
  | "profileSetup"
  | "UploadF"
  | "adminDashb"
  | "productDetails"
  | "office"
  | "SellerPart"
  | "settings";

const App = () => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [arUri, setArUri] = useState<string>("");
  const [showIntro, setShowIntro] = useState(true);
  const [screenParams, setScreenParams] = useState<any>(null);

  const goToScreen = (target: Screen, params?: any) => {
    if (target === "ar" && params?.uri) {
      setArUri(params.uri);
    }
    setScreenParams(params ?? null);
    setScreen(target);
  };

  if (screen === "adminDashb")
    return <AdminDashboardScreen goToScreen={goToScreen} />;

  if (screen === "productDetails" && screenParams?.product) {
    return (
      <ProductDetails product={screenParams.product} goToScreen={goToScreen} />
    );
  }
  if (screen === "SellerPart") return <SellerPart goToScreen={goToScreen} />;
  if (screen === "UploadF")
    return (
      <FurnitureUploadScreen
        goBack={() => setScreen("SellerPart")}
        goToScreen={goToScreen}
      />
    );

  if (screen === "intro") return <IntroFlow onDone={() => setScreen("home")} />;

  if (screen === "lreg") return <LRegScreen goToScreen={goToScreen} />;

  if (screen === "home")
    return (
      <HomeScreen
        onEnterShop={() => setScreen("shopfur")}
        goToScreen={goToScreen}
      />
    );

  if (["Chair", "Sofa", "TVStand", "Shelves", "Table"].includes(screen))
    return (
      <ShopfurScreen
        category={screen as "Chair" | "Sofa" | "TVStand" | "Shelves" | "Table"}
        goToScreen={goToScreen}
      />
    );

  if (screen === "profileSetup" && screenParams)
    return (
      <ProfileSetupScreen
        goToScreen={goToScreen}
        route={{ params: screenParams }}
      />
    );
  if (screen === "Inbox") {
    return <Inbox goBack={() => setScreen("home")} goToScreen={goToScreen} />;
  }

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
      />
    );

  if (screen === "broomt")
    return (
      <BRoomtScreen
        goBack={() => setScreen("furniture")}
        goToScreen={goToScreen}
      />
    );

  if (screen === "office")
    return (
      <OfficeScreent
        goBack={() => setScreen("furniture")}
        goToScreen={goToScreen}
      />
    );

  if (["BedChair", "Wardrobe", "Bed"].includes(screen))
    return (
      <BRScreen
        category={screen as "BedChair" | "Wardrobe" | "Bed"}
        goToScreen={goToScreen}
      />
    );

  if (["officechair", "laptopstand", "officedesk"].includes(screen))
    return (
      <Of
        category={screen as "officechair" | "laptopstand" | "officedesk"}
        goToScreen={goToScreen}
      />
    );

  if (screen === "profile")
    return <Profile goToScreen={goToScreen} goBack={() => setScreen("home")} />;

  if (screen === "Wishlist")
    return <Wishlist goBack={() => setScreen("home")} />;

  if (screen === "settings")
    return (
      <SettingsScreen
        goBack={() => setScreen("home")}
        goToScreen={goToScreen}
      />
    );

  return null;
};

export default App;
