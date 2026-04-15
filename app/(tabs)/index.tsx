import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
import { useAuth } from '../../lib/auth';
import { useLocation, getDistanceMiles, formatDistance } from '../../lib/useLocation';

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

function DealCard({ deal, onPress, isWide, isSaved, onToggleSave, isSignedIn, distance }: {
  deal: Deal;
  onPress: () => void;
  isWide: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
  isSignedIn?: boolean;
  distance?: number | null;
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
        {isSignedIn && (
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={(e) => { e.stopPropagation(); onToggleSave?.(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.heartIcon}>{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
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
            {distance != null ? (
              <Text style={styles.distanceBadge}>{`  ·  ${formatDistance(distance)}`}</Text>
            ) : null}
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
  const { user, signInWithGoogle, signOut } = useAuth();
  const { location: userLocation } = useLocation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableNowFilter, setAvailableNowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState<'South Bay' | 'OC'>('South Bay');
  const [savedDeals, setSavedDeals] = useState<Set<number>>(new Set());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [savedFilter, setSavedFilter] = useState(false);
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

  // Fetch saved deals when user signs in
  useEffect(() => {
    if (!user) {
      setSavedDeals(new Set());
      setSavedFilter(false);
      return;
    }
    supabase
      .from('saved_deals')
      .select('deal_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSavedDeals(new Set(data.map((r: any) => r.deal_id)));
      });
  }, [user]);

  async function toggleSaveDeal(dealId: number) {
    if (!user) return;
    if (savedDeals.has(dealId)) {
      setSavedDeals((prev) => { const next = new Set(prev); next.delete(dealId); return next; });
      await supabase.from('saved_deals').delete().eq('user_id', user.id).eq('deal_id', dealId);
    } else {
      setSavedDeals((prev) => new Set(prev).add(dealId));
      await supabase.from('saved_deals').insert({ user_id: user.id, deal_id: dealId });
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchDeals();
  }

  // Region filter — positive matching for both regions so stray cities don't bleed in
  const SOUTH_BAY_NEIGHBORHOODS = [
    'palo alto', 'menlo park', 'redwood city', 'mountain view', 'sunnyvale',
    'san jose', 'santa clara', 'cupertino', 'los altos', 'east palo alto',
    'atherton', 'portola valley', 'woodside', 'foster city', 'san mateo',
    'burlingame', 'millbrae', 'belmont', 'san carlos',
  ];
  const OC_NEIGHBORHOODS = [
    'irvine', 'tustin', 'costa mesa', 'newport beach', 'newport', 'anaheim',
    'santa ana', 'huntington beach', 'laguna', 'fullerton', 'orange', 'brea',
    'yorba linda', 'mission viejo', 'lake forest', 'aliso viejo',
    // LA South Bay cities go under OC tab for now
    'gardena', 'redondo beach', 'torrance', 'hawthorne', 'inglewood',
    'manhattan beach', 'hermosa beach', 'el segundo', 'compton', 'carson',
    'long beach', 'lakewood',
  ];
  const regionDeals = deals.filter((d) => {
    const n = (d.neighborhood || '').toLowerCase();
    if (region === 'South Bay') {
      return SOUTH_BAY_NEIGHBORHOODS.some((nb) => n.includes(nb));
    } else {
      return OC_NEIGHBORHOODS.some((nb) => n.includes(nb));
    }
  });

  // Compute distance from user to each deal
  const distanceMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!userLocation) return map;
    for (const deal of regionDeals) {
      if (deal.latitude != null && deal.longitude != null) {
        map.set(
          deal.id,
          getDistanceMiles(userLocation.latitude, userLocation.longitude, deal.latitude, deal.longitude),
        );
      }
    }
    return map;
  }, [regionDeals, userLocation]);

  // Sort: primary by availability, secondary by distance (if location available)
  const TAG_PRIORITY = { available: 0, upcoming: 1, not_available: 2 };
  const sorted = [...regionDeals].sort((a, b) => {
    const aTag = getAvailability(a).tag;
    const bTag = getAvailability(b).tag;
    const primary = TAG_PRIORITY[aTag] - TAG_PRIORITY[bTag];
    if (primary !== 0) return primary;

    // Within the same availability group, sort by distance if we have location
    if (userLocation) {
      const aDist = distanceMap.get(a.id) ?? Infinity;
      const bDist = distanceMap.get(b.id) ?? Infinity;
      if (aDist !== bDist) return aDist - bDist;
    }

    // Fallback sub-sorts for when no location or same distance
    if (aTag === 'not_available') {
      const aEndedToday = getAvailability(a).detail.startsWith('Ended');
      const bEndedToday = getAvailability(b).detail.startsWith('Ended');
      if (aEndedToday && !bEndedToday) return -1;
      if (!aEndedToday && bEndedToday) return 1;
      if (aEndedToday && bEndedToday && a.end_time && b.end_time) {
        return b.end_time.localeCompare(a.end_time);
      }
    }
    if (aTag === 'upcoming' && a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    return 0;
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
  const afterAvailable = availableNowFilter ? searched.filter(isAvailableNow) : searched;
  const filtered = savedFilter ? afterAvailable.filter((d) => savedDeals.has(d.id)) : afterAvailable;

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
      {/* Search bar + profile */}
      <View style={[styles.searchWrap, isDesktop && styles.searchWrapDesktop]}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, isDesktop && styles.searchBarDesktop, { flex: 1 }]}>
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
          {user ? (
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Text style={styles.profileInitial}>
                {(user.email?.[0] || 'U').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signInBtn} onPress={signInWithGoogle}>
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Profile dropdown */}
        {showProfileMenu && user && (
          <View style={styles.profileMenu}>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => { signOut(); setShowProfileMenu(false); }}
            >
              <Text style={styles.profileMenuText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Region + Available Now toggles — collapses on scroll */}
      <Animated.View style={[
        styles.toggleWrap,
        isDesktop && styles.toggleWrapDesktop,
        {
          maxHeight: filterHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 52] }),
          opacity: filterHeight,
          overflow: 'hidden' as const,
        },
      ]}>
        {/* Region selector */}
        <TouchableOpacity
          style={[styles.toggleBtn, region === 'South Bay' && styles.regionBtnActive]}
          onPress={() => setRegion('South Bay')}
        >
          <Text style={[styles.toggleText, region === 'South Bay' && styles.regionTextActive]}>
            South Bay
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, region === 'OC' && styles.regionBtnActive]}
          onPress={() => setRegion('OC')}
        >
          <Text style={[styles.toggleText, region === 'OC' && styles.regionTextActive]}>
            OC
          </Text>
        </TouchableOpacity>

        <View style={styles.toggleDivider} />

        <TouchableOpacity
          style={[styles.toggleBtn, availableNowFilter && styles.toggleBtnActive]}
          onPress={() => setAvailableNowFilter(!availableNowFilter)}
        >
          <Text style={[styles.toggleText, availableNowFilter && styles.toggleTextActive]}>
            Available Now
          </Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            style={[styles.toggleBtn, savedFilter && styles.toggleBtnActive]}
            onPress={() => setSavedFilter(!savedFilter)}
          >
            <Text style={[styles.toggleText, savedFilter && styles.toggleTextActive]}>
              ❤️ Saved
            </Text>
          </TouchableOpacity>
        )}
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
              : userLocation
              ? 'Near you'
              : 'All deals'}
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
              onPress={() => router.push(`/deal/${deal.id}` as any)}
              isWide={false}
              isSaved={savedDeals.has(deal.id)}
              onToggleSave={() => toggleSaveDeal(deal.id)}
              isSignedIn={!!user}
              distance={distanceMap.get(deal.id) ?? null}
            />
          ))
        ) : (
          getRows(filtered, columns).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onPress={() => router.push(`/deal/${deal.id}` as any)}
                  isWide={true}
                  isSaved={savedDeals.has(deal.id)}
                  onToggleSave={() => toggleSaveDeal(deal.id)}
                  isSignedIn={!!user}
                  distance={distanceMap.get(deal.id) ?? null}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' },

  // Search
  searchWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff' },
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
    fontSize: 16,
    color: '#222',
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,
  searchClear: { fontSize: 14, color: '#b0b0b0', paddingLeft: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E1306C',
    justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { color: '#fff', fontSize: 15, fontWeight: '700' },
  signInBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E1306C',
  },
  signInText: { fontSize: 13, fontWeight: '600', color: '#E1306C' },
  profileMenu: {
    marginTop: 8, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#ebebeb', padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  profileEmail: { fontSize: 13, color: '#717171', marginBottom: 8 },
  profileMenuItem: { paddingVertical: 6 },
  profileMenuText: { fontSize: 14, fontWeight: '600', color: '#E1306C' },

  // Toggle (replaces filter pills)
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff0f5',
    borderColor: '#f5c0d5',
  },
  toggleText: { fontSize: 13, fontWeight: '500', color: '#717171', textAlign: 'center' },
  toggleTextActive: { color: '#E1306C' },
  regionBtnActive: { backgroundColor: '#fff0f5', borderColor: '#f5c0d5' },
  regionTextActive: { color: '#E1306C', fontWeight: '700' },
  toggleDivider: { width: 1, backgroundColor: '#ebebeb', marginVertical: 4 },

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
  gridRow: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },

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
  heartBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 3,
  },
  heartIcon: { fontSize: 16 },
  // Card body
  cardBody: { padding: 16, flex: 1 },
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
  distanceBadge: { color: '#6366f1', fontWeight: '600' as const },

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
