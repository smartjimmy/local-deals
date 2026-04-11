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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

function openDirections(address: string) {
  const encoded = encodeURIComponent(address);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  Linking.openURL(url);
}

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: imageUri }} style={styles.heroImg} />
          <TouchableOpacity style={styles.heroBack} onPress={() => router.back()}>
            <Text style={styles.heroBackText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroHeart} onPress={() => setSaved(!saved)}>
            <Text style={styles.heroHeartIcon}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.body}>
          {/* Name + verified */}
          <View style={styles.titleRow}>
            <Text style={styles.restaurantName}>{deal.restaurant_name}</Text>
            <Text style={styles.verified}>✓ Verified</Text>
          </View>

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
                <Text style={styles.infoSub}>{deal.neighborhood}</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Verified note */}
          <View style={styles.verifiedBox}>
            <Text style={styles.verifiedBoxTitle}>✓ Last verified {formatDate(deal.last_verified)}</Text>
            <Text style={styles.verifiedBoxNote}>
              Always call ahead to confirm the deal is still available.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      {deal.address ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => openDirections(deal.address)}
            activeOpacity={0.85}
          >
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 100, maxWidth: 720, width: '100%', alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' },
  errorText: { fontSize: 16, color: '#717171', marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#E1306C', borderRadius: 24 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  // Hero image
  heroWrap: { position: 'relative' },
  heroImg: { width: '100%', height: 280, backgroundColor: '#f0f0f0' },
  heroBack: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  heroBackText: { fontSize: 18, color: '#222' },
  heroHeart: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  heroHeartIcon: { fontSize: 18 },

  // Body
  body: { padding: 20 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: { fontSize: 24, fontWeight: '800', color: '#222', letterSpacing: -0.5 },
  verified: { fontSize: 12, fontWeight: '600', color: '#008a05' },
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
  directionsBtn: {
    backgroundColor: '#E1306C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    maxWidth: 720,
    width: '100%',
  },
  directionsBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
