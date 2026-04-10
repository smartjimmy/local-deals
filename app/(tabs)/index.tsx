import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const JS_DAY_TO_ABBR: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

const CATEGORIES = ['All', 'Happy Hour', 'Brunch', 'Lunch', 'Dinner', 'Drinks', 'Other'];

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayAbbr(): string {
  return JS_DAY_TO_ABBR[new Date().getDay()];
}

export default function DealsScreen() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(todayAbbr());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  async function fetchDeals() {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('is_active', true)
      .order('restaurant_name');

    if (error) {
      console.error('Error fetching deals:', error.message);
    } else {
      setDeals(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchDeals();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchDeals();
  }

  const filtered = deals.filter((d) => {
    const dayMatch = d.days_of_week?.toLowerCase().includes(selectedDay.toLowerCase());
    const catMatch = selectedCategory === 'All' || d.category === selectedCategory;
    return dayMatch && catMatch;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Loading deals…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽 Local Deals</Text>
        <Text style={styles.headerSub}>
          {filtered.length} deal{filtered.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Day filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.filterChip, selectedDay === day && styles.filterChipActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.filterChipText, selectedDay === day && styles.filterChipTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, styles.filterChipCat, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deal cards */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E85D04" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No deals found</Text>
            <Text style={styles.emptyText}>Try a different day or category.</Text>
          </View>
        ) : (
          filtered.map((deal) => (
            <TouchableOpacity
              key={deal.id}
              style={styles.card}
              onPress={() => router.push(`/deal/${deal.id}` as any)}
              activeOpacity={0.85}
            >
              {/* Restaurant name + category badge */}
              <View style={styles.cardTopRow}>
                <Text style={styles.restaurantName}>{deal.restaurant_name}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{deal.category}</Text>
                </View>
              </View>

              {/* Deal description */}
              <Text style={styles.dealDescription}>{deal.deal_description}</Text>

              {/* Hours — prominent */}
              <View style={styles.timingRow}>
                <Text style={styles.timingIcon}>🕐</Text>
                <Text style={styles.timingText}>
                  {formatTime(deal.start_time)} – {formatTime(deal.end_time)}
                </Text>
                <Text style={styles.timingDivider}>·</Text>
                <Text style={styles.daysText}>{deal.days_of_week}</Text>
              </View>

              {/* Neighborhood + last verified */}
              <View style={styles.cardBottomRow}>
                <Text style={styles.neighborhood}>📍 {deal.neighborhood}</Text>
                <Text style={styles.lastVerified}>✓ Verified {formatDate(deal.last_verified)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F5F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F5F0' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15 },
  header: { backgroundColor: '#E85D04', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filterRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EBE3', maxHeight: 52 },
  filterRowContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F0EBE3', borderWidth: 1, borderColor: '#E0D9CF' },
  filterChipCat: { backgroundColor: '#FFF5EE', borderColor: '#FDDBB0' },
  filterChipActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, gap: 8 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  restaurantName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  categoryBadge: { backgroundColor: '#FFF0E6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', color: '#E85D04' },
  dealDescription: { fontSize: 14, color: '#444', lineHeight: 20 },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF8F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  timingIcon: { fontSize: 13 },
  timingText: { fontSize: 13, fontWeight: '700', color: '#E85D04' },
  timingDivider: { color: '#CCC', fontWeight: '700' },
  daysText: { fontSize: 12, color: '#666', flex: 1 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  neighborhood: { fontSize: 12, color: '#888' },
  lastVerified: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptyText: { fontSize: 14, color: '#888' },
});
