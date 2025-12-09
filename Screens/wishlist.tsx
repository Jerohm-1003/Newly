import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Linking,
  Animated,
} from "react-native";
import { auth, firestore } from "../firebase/firebaseConfig";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import CustomAlert from "./CustomAlert";

interface WishlistProps {
  goBack?: () => void;
}

interface WishlistCardProps {
  item: any;
  onPress: (item: any) => void;
  onRemoveRequest: (id: string, runRemoveAnim: () => void) => void;
}

const WishlistCard: React.FC<WishlistCardProps> = ({
  item,
  onPress,
  onRemoveRequest,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [hideAnim] = useState(new Animated.Value(1));

  const handleRemove = () => {
    onRemoveRequest(item.docId, () => {
      Animated.timing(hideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: Animated.multiply(fadeAnim, hideAnim),
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.card} activeOpacity={1}>
        <View style={styles.imageSection}>
          <Image
            source={
              item.image
                ? { uri: item.image }
                : require("../assets/cart_icon.png")
            }
            style={styles.productImage}
          />

          <View style={styles.heartBadge}>
            <Text style={styles.heartIcon}>♥</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.topContent}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>
                ₱ {item.price.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Trigger remove request with animation callback */}
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
            activeOpacity={0.7}
          >
            <Text style={styles.removeIcon}>🗑️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.arButton}
            onPress={() => onPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.arButtonContent}>
              <Text style={styles.arIcon}>👓</Text>
              <Text style={styles.arButtonText}>View in AR</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Wishlist: React.FC<WishlistProps> = ({ goBack }) => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [headerAnim] = useState(new Animated.Value(0));
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [alertVisible, setAlertVisible] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [pendingAnimCallback, setPendingAnimCallback] = useState<any>(null);

  const confirmRemove = async () => {
    if (!pendingRemoveId) return;

    // Hide the alert immediately
    setAlertVisible(false);

    // Run the hide animation first
    if (pendingAnimCallback) {
      pendingAnimCallback();
    }

    // Wait for animation duration then delete Firestore doc
    setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        await deleteDoc(
          doc(firestore, "users", user.uid, "wishlist", pendingRemoveId)
        );
      } catch (err) {
        console.log("Remove wishlist error:", err);
      }

      setPendingRemoveId(null);
      setPendingAnimCallback(null);
    }, 200); // same duration as hideAnim
  };

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const user = auth.currentUser;
    if (!user) return;

    const wishlistRef = collection(firestore, "users", user.uid, "wishlist");

    const unsub = onSnapshot(wishlistRef, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        docId: docSnap.id, // real Firestore document ID
        ...docSnap.data(),
      }));
      setWishlist(data);
      setIsInitialLoading(false);
    });

    return () => unsub();
  }, []);

  const openARView = (item: any) => {
    const url = `arfurniture://start?category=${item.category}&prefabKey=${item.prefabKey}`;
    Linking.openURL(url);
  };

  // Called when user taps trash icon
  const requestRemove = (docId: string, runAnim: () => void) => {
    setPendingRemoveId(docId);
    setPendingAnimCallback(() => runAnim);
    setAlertVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Wishlist</Text>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{wishlist.length}</Text>
          </View>
        </View>
      </Animated.View>

      {/* <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.multiButton}
          onPress={() => Linking.openURL("arfurniture://multiple")}
          activeOpacity={0.7}
        >
          <View style={styles.multiButtonContent}>
            <Text style={styles.multiIcon}>🎯</Text>
            <Text style={styles.multiButtonText}>Open Multiple</Text>
          </View>
        </TouchableOpacity>
      </View> */}

      <CustomAlert
        visible={alertVisible}
        type="warning"
        title="Remove Item"
        message="Are you sure you want to remove this from your wishlist?"
        confirmText="Remove"
        cancelText="Cancel"
        showCancel={true}
        onCancel={() => {
          setAlertVisible(false);
          setPendingRemoveId(null);
          setPendingAnimCallback(null);
        }}
        onConfirm={confirmRemove}
      />

      {isInitialLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#666", marginTop: 10 }}>
            Loading wishlist...
          </Text>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item) => item.docId}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <WishlistCard
              item={item}
              onPress={openARView}
              onRemoveRequest={requestRemove}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}>
                <Text style={styles.emptyIcon}>💫</Text>
              </View>
              <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
              <Text style={styles.emptyText}>
                Start adding furniture you love
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  countBadge: {
    backgroundColor: "#007AFF",
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  countText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  multiButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  multiButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  multiIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  multiButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    height: 130,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 3,
  },
  imageSection: {
    width: 130,
    height: "100%",
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heartBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: {
    fontSize: 16,
    color: "#ff3b30",
  },
  contentSection: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  topContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 2,
    color: "#666",
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
  },
  arButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
  },
  arButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  arIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  arButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  removeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 10,
  },
  removeIcon: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
});

export default Wishlist;
