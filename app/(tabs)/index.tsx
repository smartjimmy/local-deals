import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
  TextInput,
  useWindowDimensions,
  Animated,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { type Deal, formatGoogleRating, getDealImageUri } from '../../lib/deal';

const JS_DAY_TO_ABBR: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

function formatTime(t: string | null): string {
  if (!t) return '—';
  const [hourStr, minStr] = t.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${minStr} ${ampm}`;
}

function todayAbbr(): string {
  return JS_DAY_TO_ABBR[new Date().getDay()];
}

type AvailabilityStatus =
  | { tag: 'available'; detail: string }
  | { tag: 'upcoming'; detail: string }
  | { tag: 'not_available'; detail: string };

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function getAvailability(deal: Deal): AvailabilityStatus {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayMatch = deal.days_of_week?.toLowerCase().includes(todayAbbr().toLowerCase());

  if (!deal.start_time || !deal.end_time) {
    if (todayMatch) return { tag: 'available', detail: 'Available today' };
    return { tag: 'not_available', detail: `Available ${deal.days_of_week}` };
  }

  const [sh, sm] = deal.start_time.split(':').map(Number);
  const [eh, em] = deal.end_time.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (todayMatch) {
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      const remaining = endMinutes - currentMinutes;
      return { tag: 'available', detail: `For the next ${formatDuration(remaining)}` };
    }
    if (currentMinutes < startMinutes) {
      const until = startMinutes - currentMinutes;
      return { tag: 'upcoming', detail: `Available in ${formatDuration(until)}` };
    }
    // Already passed today
    return { tag: 'not_available', detail: `Ended at ${formatTime(deal.end_time)}` };
  }

  return { tag: 'not_available', detail: `Available ${deal.days_of_week}` };
}

function isAvailableNow(deal: Deal): boolean {
  return getAvailability(deal).tag === 'available';
}

const TAG_STYLES = {
  available: { bg: '#E8F5E9', color: '#2E7D32' },
  upcoming: { bg: '#FFF3E0', color: '#E65100' },
  not_available: { bg: '#f0f0f0', color: '#888' },
};

function DealCard({ deal, saved, onToggleSave, onPress, isWide }: {
  deal: Deal;
  saved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
  isWide: boolean;
}) {
  const availability = getAvailability(deal);
  const ratingText = formatGoogleRating(deal.id);
  const tagLabel = availability.tag === 'available' ? 'Available Now'
    : availability.tag === 'upcoming' ? 'Upcoming'
    : 'Not Available';
  const tagStyle = TAG_STYLES[availability.tag];

  return (
    <TouchableOpacity
      style={[styles.card, isWide && styles.cardWide]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.cardImgWrap}>
        <Image
          source={{ uri: getDealImageUri(deal) }}
          style={[styles.cardImg, isWide && styles.cardImgWide]}
        />
        <TouchableOpacity
          style={styles.cardHeart}
          onPress={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
        >
          <Text style={styles.cardHeartIcon}>
            {saved ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{deal.restaurant_name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{deal.deal_description}</Text>

        {/* Availability tag */}
        <View style={styles.availabilityRow}>
          <View style={[styles.availabilityTag, { backgroundColor: tagStyle.bg }]}>
            <Text style={[styles.availabilityTagText, { color: tagStyle.color }]}>{tagLabel}</Text>
          </View>
          <Text style={[styles.availabilityDetail, { color: tagStyle.color }]}>
            {availability.detail}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaLine}>
            {`📍 ${deal.neighborhood}`}
            {ratingText != null ? (
              <Text>
                {'  ·  '}
                <Text style={styles.cardRatingStar}>★</Text>
                {` ${ratingText}`}
              </Text>
            ) : null}
          </Text>
          <Text style={styles.cardMetaLine}>🕐 {formatTime(deal.start_time)} – {formatTime(deal.end_time)} · {deal.days_of_week}</Text>
        </View>
      </View>

      <View style={styles.cardCta}>
        <Text style={styles.cardCtaText}>View deal</Text>
        <Text style={styles.cardCtaArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DealsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableNowFilter, setAvailableNowFilter] = useState(false);
  const [savedDeals, setSavedDeals] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const lastScrollY = useRef(0);
  const filterHeight = useRef(new Animated.Value(1)).current;

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastScrollY.current;
    // Only collapse/expand after meaningful scroll (>5px) and past initial area
    if (y > 20 && delta > 5 && showFilters) {
      setShowFilters(false);
      Animated.timing(filterHeight, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    } else if ((delta < -5 || y <= 20) && !showFilters) {
      setShowFilters(true);
      Animated.timing(filterHeight, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    }
    lastScrollY.current = y;
  }, [showFilters]);

  const isDesktop = width >= 1024;
  const isTablet = width >= 640 && width < 1024;
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;

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

  function toggleSave(dealId: number) {
    setSavedDeals((prev) => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  }

  // Sort by availability: available > upcoming > not available
  const TAG_PRIORITY = { available: 0, upcoming: 1, not_available: 2 };
  const sorted = [...deals].sort((a, b) => {
    return TAG_PRIORITY[getAvailability(a).tag] - TAG_PRIORITY[getAvailability(b).tag];
  });
  const searched = searchQuery.trim().length > 0
    ? sorted.filter((d) => {
        const q = searchQuery.toLowerCase();
        return (
          d.restaurant_name.toLowerCase().includes(q) ||
          d.deal_description.toLowerCase().includes(q) ||
          d.neighborhood?.toLowerCase().includes(q) ||
          d.category?.toLowerCase().includes(q)
        );
      })
    : sorted;
  const filtered = availableNowFilter ? searched.filter(isAvailableNow) : searched;

  function getRows(items: Deal[], cols: number): Deal[][] {
    const rows: Deal[][] = [];
    for (let i = 0; i < items.length; i += cols) {
      rows.push(items.slice(i, i + cols));
    }
    return rows;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E1306C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={[styles.searchWrap, isDesktop && styles.searchWrapDesktop]}>
        <View style={[styles.searchBar, isDesktop && styles.searchBarDesktop]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants or deals"
            placeholderTextColor="#b0b0b0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Available Now toggle — collapses on scroll */}
      <Animated.View style={[
        styles.toggleWrap,
        isDesktop && styles.toggleWrapDesktop,
        {
          maxHeight: filterHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 52] }),
          opacity: filterHeight,
          overflow: 'hidden' as const,
        },
      ]}>
        <TouchableOpacity
          style={[styles.toggleBtn, availableNowFilter && styles.toggleBtnActive]}
          onPress={() => setAvailableNowFilter(!availableNowFilter)}
        >
          <Text style={[styles.toggleText, availableNowFilter && styles.toggleTextActive]}>
            Available Now
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Deal cards */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          isDesktop && styles.listContentDesktop,
          isTablet && styles.listContentTablet,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E1306C" />}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Section header — scrolls with content */}
        <View style={[styles.sectionHeader, isDesktop && styles.sectionHeaderDesktop]}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim()
              ? `Results for "${searchQuery.trim()}"`
              : availableNowFilter
              ? 'Available now'
              : 'Near you'}
          </Text>
          <Text style={styles.sectionCount}>
            {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {searchQuery.trim() ? '🔍' : availableNowFilter ? '🌙' : '🍽'}
            </Text>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim()
                ? 'No matches found'
                : availableNowFilter
                ? 'No deals right now'
                : 'No deals found'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `No restaurants or deals matching "${searchQuery.trim()}". Try a different search.`
                : availableNowFilter
                ? 'Happy hour is over for today — turn off the filter to browse upcoming deals and plan your next outing!'
                : 'Check back soon for new deals.'}
            </Text>
            {(searchQuery.trim() || availableNowFilter) && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => {
                  setSearchQuery('');
                  setAvailableNowFilter(false);
                }}
              >
                <Text style={styles.emptyBtnText}>Show all deals</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : columns === 1 ? (
          filtered.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              saved={savedDeals.has(deal.id)}
              onToggleSave={() => toggleSave(deal.id)}
              onPress={() => router.push(`/deal/${deal.id}` as any)}
              isWide={false}
            />
          ))
        ) : (
          getRows(filtered, columns).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  saved={savedDeals.has(deal.id)}
                  onToggleSave={() => toggleSave(deal.id)}
                  onPress={() => router.push(`/deal/${deal.id}` as any)}
                  isWide={true}
                />
              ))}
              {row.length < columns &&
                Array.from({ length: columns - row.length }).map((_, i) => (
                  <View key={`spacer-${i}`} style={styles.cardWide} />
                ))
              }
            </View>
          ))
        )}
        {/* Spacer for bottom nav */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🍽</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>❤️</Text>
          <Text style={styles.navLabel}>Saved</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' },

  // Search
  searchWrap: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff' },
  searchWrapDesktop: { paddingHorizontal: 48 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ebebeb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBarDesktop: { maxWidth: 600 },
  searchIcon: { fontSize: 16, opacity: 0.5 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,
  searchClear: { fontSize: 14, color: '#b0b0b0', paddingLeft: 8 },

  // Toggle (replaces filter pills)
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  toggleWrapDesktop: { paddingHorizontal: 48 },
  toggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ebebeb',
    backgroundColor: 'transparent',
  },
  toggleBtnActive: {
    backgroundColor: '#fff0f5',
    borderColor: '#f5c0d5',
  },
  toggleText: { fontSize: 13, fontWeight: '500', color: '#717171' },
  toggleTextActive: { color: '#E1306C' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 4,
  },
  sectionHeaderDesktop: {},
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#222', letterSpacing: -0.5 },
  sectionCount: { fontSize: 13, fontWeight: '500', color: '#717171' },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 16 },
  listContentTablet: { paddingHorizontal: 32 },
  listContentDesktop: { paddingHorizontal: 48 },

  // Grid
  gridRow: { flexDirection: 'row', gap: 16 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardWide: { flex: 1 },
  cardImgWrap: { position: 'relative' },
  cardImg: { width: '100%', height: 180, backgroundColor: '#f0f0f0' },
  cardImgWide: { height: 200 },
  cardHeart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeartIcon: { fontSize: 16 },

  // Card body
  cardBody: { padding: 16 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#222', letterSpacing: -0.2, marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#717171', lineHeight: 21, marginBottom: 12 },

  // Availability tag
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  availabilityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availabilityTagText: { fontSize: 11, fontWeight: '700' },
  availabilityDetail: { fontSize: 12, fontWeight: '500' },

  cardMeta: { gap: 4 },
  cardMetaLine: { fontSize: 13, color: '#717171' },
  cardRatingStar: { color: '#E1306C' },

  // CTA
  cardCta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ebebeb',
  },
  cardCtaText: { fontSize: 13, fontWeight: '600', color: '#E1306C' },
  cardCtaArrow: { fontSize: 16, color: '#E1306C' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  emptyText: { fontSize: 14, color: '#717171', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#E1306C',
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ebebeb',
    paddingTop: 8,
    paddingBottom: 24,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#b0b0b0' },
  navLabelActive: { color: '#E1306C' },
});
