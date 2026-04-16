import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { type Deal, getDealImageUri, formatGoogleRating } from '../../lib/deal';
import { useAuth } from '../../lib/auth';
import { useLocation, getDistanceMiles, formatDistance } from '../../lib/useLocation';

export default function SavedScreen() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { location: userLocation } = useLocation();
  const [savedDeals, setSavedDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedDeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get saved deal IDs
      const { data: savedRows } = await supabase
        .from('saved_deals')
        .select('deal_id')
        .eq('user_id', user.id);

      if (!savedRows || savedRows.length === 0) {
        setSavedDeals([]);
        setLoading(false);
        return;
      }

      const dealIds = savedRows.map((r: any) => r.deal_id);

      // Fetch the actual deals
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .in('id', dealIds)
        .eq('is_active', true);

      setSavedDeals(deals || []);
    } catch (err) {
      console.error('Error fetching saved deals:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh saved deals every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSavedDeals();
    }, [fetchSavedDeals])
  );

  async function removeSavedDeal(dealId: number) {
    if (!user) return;
    setSavedDeals((prev) => prev.filter((d) => d.id !== dealId));
    await supabase.from('saved_deals').delete().eq('user_id', user.id).eq('deal_id', dealId);
  }

  // Logged-out empty state
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Deals</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>Save your favorite deals</Text>
          <Text style={styles.emptySubtitle}>
            Sign in to save deals, get personalized recommendations, and access your favorites across all your devices.
          </Text>
          <TouchableOpacity style={styles.signInBtn} onPress={signInWithGoogle}>
            <Text style={styles.signInBtnText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Logged-in but no saved deals
  if (!loading && savedDeals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Deals</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No saved deals yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on any deal to save it here for quick access later.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Deals</Text>
        <Text style={styles.headerCount}>{savedDeals.length} deal{savedDeals.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#E1306C" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={savedDeals}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: deal }) => {
            const distance =
              userLocation && deal.latitude != null && deal.longitude != null
                ? getDistanceMiles(userLocation.latitude, userLocation.longitude, deal.latitude, deal.longitude)
                : null;
            const rating = formatGoogleRating(deal.id);

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/deal/${deal.id}`)}
              >
                <Image source={{ uri: getDealImageUri(deal) }} style={styles.cardImg} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardRestaurant} numberOfLines={1}>
                    {deal.restaurant_name}
                  </Text>
                  <Text style={styles.cardDeal} numberOfLines={2}>
                    {deal.deal_description}
                  </Text>
                  <View style={styles.cardMeta}>
                    {rating && <Text style={styles.metaText}>⭐ {rating}</Text>}
                    {distance != null && (
                      <Text style={styles.metaText}>📍 {formatDistance(distance)}</Text>
                    )}
                    <Text style={styles.metaText}>{deal.category}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeSavedDeal(deal.id)}
                >
                  <Text style={styles.removeIcon}>❤️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  headerCount: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  signInBtn: {
    backgroundColor: '#E1306C',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
    overflow: 'hidden',
  },
  cardImg: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardRestaurant: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  cardDeal: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  removeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  removeIcon: {
    fontSize: 20,
  },
});
