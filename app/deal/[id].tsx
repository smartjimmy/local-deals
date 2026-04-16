import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Image,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { type Deal, formatGoogleRating, getDealImageUri } from '../../lib/deal';

function formatTime(t: string | null): string {
  if (!t) return '—';
  const [hourStr, minStr] = t.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${minStr} ${ampm}`;
}

function formatDate(d: string | null): string {
  if (!d) return 'Unknown';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function openDirections(restaurantName: string, address: string) {
  const query = encodeURIComponent(`${restaurantName}, ${address}`);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
}

function callRestaurant(phone: string | null | undefined, restaurantName: string, city: string) {
  if (phone) {
    // Direct call if we have the number
    Linking.openURL(`tel:${phone.replace(/[^+\d]/g, '')}`);
  } else {
    // Fallback: Google search for their phone number
    const query = encodeURIComponent(`${restaurantName} ${city} phone number`);
    const url = `https://www.google.com/search?q=${query}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  }
}

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchDeal() {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching deal:', error.message);
      } else {
        setDeal(data);
      }
      setLoading(false);
    }

    if (id) fetchDeal();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E1306C" />
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Deal not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUri = getDealImageUri(deal);
  const ratingText = formatGoogleRating(deal.id);
  const dealUrl = `https://local-deals-xi.vercel.app/deal/${deal.id}`;

  async function shareDeal() {
    const message = `${deal.restaurant_name} — ${deal.deal_description}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: deal.restaurant_name, text: message, url: dealUrl });
      } else if (Platform.OS === 'web') {
        // Fallback: copy to clipboard
        await navigator.clipboard?.writeText(`${message}\n${dealUrl}`);
        alert('Link copied to clipboard!');
      } else {
        await Share.share({ message: `${message}\n${dealUrl}` });
      }
    } catch (err) {
      // User cancelled share — ignore
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: deal.restaurant_name }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: imageUri }} style={styles.heroImg} />
          <TouchableOpacity style={styles.shareBtn} onPress={shareDeal} activeOpacity={0.85}>
            {/* iOS-style share icon: box with upward arrow */}
            <View style={styles.shareIconWrap}>
              <View style={styles.shareArrowStem} />
              <View style={styles.shareArrowHead}>
                <View style={styles.shareArrowLeft} />
                <View style={styles.shareArrowRight} />
              </View>
              <View style={styles.shareBox} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.body}>
          {/* Name */}
          <Text style={styles.restaurantName}>{deal.restaurant_name}</Text>

          {ratingText != null ? (
            <Text style={styles.googleRating}>
              <Text style={styles.googleRatingStar}>★</Text>
              {` ${ratingText} on Google`}
            </Text>
          ) : null}

          {/* Description */}
          <Text style={styles.description}>{deal.deal_description}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Info rows */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕐</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue}>
                  {formatTime(deal.start_time)} – {formatTime(deal.end_time)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Days</Text>
                <Text style={styles.infoValue}>{deal.days_of_week}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{deal.address}</Text>
                {deal.neighborhood && !deal.address?.toLowerCase().includes(deal.neighborhood.toLowerCase()) && (
                  <Text style={styles.infoSub}>{deal.neighborhood}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Verified note */}
          <View style={styles.verifiedBox}>
            <Text style={styles.verifiedBoxTitle}>✓ Last verified {formatDate(deal.last_verified)}</Text>
            <Text style={styles.verifiedBoxNote}>
              We recommend calling ahead to confirm the deal is still running.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom CTAs */}
      {deal.address ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBtnRow}>
            {deal.phone ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => callRestaurant(deal.phone, deal.restaurant_name, deal.neighborhood || '')}
                activeOpacity={0.85}
              >
                <Text style={styles.callBtnText}>📞 Call</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() => openDirections(deal.restaurant_name, deal.address)}
              activeOpacity={0.85}
            >
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 100, maxWidth: 960, width: '100%', alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' },
  errorText: { fontSize: 16, color: '#717171', marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#E1306C', borderRadius: 24 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  // Hero image
  heroWrap: { position: 'relative' },
  heroImg: { width: '100%', height: 280, backgroundColor: '#f0f0f0' },
  // Body
  body: { padding: 20 },
  restaurantName: { fontSize: 24, fontWeight: '800', color: '#222', letterSpacing: -0.5, marginBottom: 8 },
  googleRating: { fontSize: 15, fontWeight: '600', color: '#717171', marginBottom: 8 },
  googleRatingStar: { color: '#E1306C' },
  description: { fontSize: 16, color: '#717171', lineHeight: 24, marginBottom: 4 },

  divider: { height: 1, backgroundColor: '#ebebeb', marginVertical: 20 },

  // Info section
  infoSection: { gap: 20 },
  infoRow: { flexDirection: 'row', gap: 14 },
  infoIcon: { fontSize: 20, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#b0b0b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#222' },
  infoSub: { fontSize: 13, color: '#717171', marginTop: 2 },

  // Verified box
  verifiedBox: {
    backgroundColor: '#f0fbf0',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  verifiedBoxTitle: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  verifiedBoxNote: { fontSize: 13, color: '#4CAF50', lineHeight: 18 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ebebeb',
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: 960,
    width: '100%',
  },
  callBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E1306C',
    width: 100,
  },
  callBtnText: { color: '#E1306C', fontSize: 16, fontWeight: '700' },
  shareBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  shareIconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  shareArrowStem: {
    width: 2,
    height: 12,
    backgroundColor: '#333',
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  shareArrowHead: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  shareArrowLeft: {
    width: 7,
    height: 2,
    backgroundColor: '#333',
    position: 'absolute',
    top: 0,
    right: 0,
    transform: [{ rotate: '45deg' }],
    transformOrigin: 'right center',
  },
  shareArrowRight: {
    width: 7,
    height: 2,
    backgroundColor: '#333',
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotate: '-45deg' }],
    transformOrigin: 'left center',
  },
  shareBox: {
    width: 14,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#333',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  directionsBtn: {
    flex: 1,
    backgroundColor: '#E1306C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  directionsBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
