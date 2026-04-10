import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Deal = {
  id: number;
  restaurant_name: string;
  deal_description: string;
  category: string;
  days_of_week: string;
  start_time: string;
  end_time: string;
  address: string;
  neighborhood: string;
  last_verified: string;
  is_active: boolean;
  created_at: string;
};

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
        <ActivityIndicator size="large" color="#E85D04" />
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back to deals</Text>
      </TouchableOpacity>

      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <Text style={styles.restaurantName}>{deal.restaurant_name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{deal.category}</Text>
          </View>
        </View>
        <Text style={styles.dealDescription}>{deal.deal_description}</Text>
      </View>

      {/* Timing — most important, shown prominently */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>HOURS</Text>
        <View style={styles.timingBox}>
          <Text style={styles.timingText}>
            🕐 {formatTime(deal.start_time)} – {formatTime(deal.end_time)}
          </Text>
          <Text style={styles.daysText}>📅 {deal.days_of_week}</Text>
        </View>
      </View>

      {/* Last verified */}
      <View style={styles.verifiedBox}>
        <Text style={styles.verifiedText}>✓ Last verified: {formatDate(deal.last_verified)}</Text>
        <Text style={styles.verifiedNote}>
          Always call ahead to confirm deal is still available.
        </Text>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOCATION</Text>
        <Text style={styles.addressText}>📍 {deal.address}</Text>
        <Text style={styles.neighborhoodText}>{deal.neighborhood}</Text>
      </View>

      {/* Directions button */}
      {deal.address ? (
        <TouchableOpacity
          style={styles.directionsBtn}
          onPress={() => openDirections(deal.address)}
          activeOpacity={0.85}
        >
          <Text style={styles.directionsBtnText}>🗺 Get Directions in Google Maps</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F5F0' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F5F0' },
  errorText: { fontSize: 16, color: '#666', marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#E85D04', borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  backLink: { marginBottom: 4 },
  backLinkText: { color: '#E85D04', fontSize: 15, fontWeight: '600' },
  headerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  restaurantName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  categoryBadge: { backgroundColor: '#FFF0E6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryBadgeText: { fontSize: 12, fontWeight: '600', color: '#E85D04' },
  dealDescription: { fontSize: 15, color: '#444', lineHeight: 22 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 1 },
  timingBox: { backgroundColor: '#FFF8F3', borderRadius: 12, padding: 16, gap: 8, borderWidth: 1, borderColor: '#FDDBB0' },
  timingText: { fontSize: 20, fontWeight: '800', color: '#E85D04' },
  daysText: { fontSize: 14, color: '#666' },
  verifiedBox: { backgroundColor: '#F0FBF0', borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: '#C8E6C9' },
  verifiedText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  verifiedNote: { fontSize: 12, color: '#4CAF50' },
  addressText: { fontSize: 15, color: '#333', fontWeight: '500' },
  neighborhoodText: { fontSize: 13, color: '#888' },
  directionsBtn: { backgroundColor: '#E85D04', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
  directionsBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
