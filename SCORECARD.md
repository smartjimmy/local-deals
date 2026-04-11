# Local Deals App Scorecard

**Core value proposition:** "I want to find a good value meal or drink near me that meets my tastes."

## Scoring Dimensions

Each dimension is scored 1–10. Weighted aggregate = overall app health.

### 1. Discovery Speed (Weight: 25%)
*How quickly can a user find a deal that matches what they want right now?*

Measures: number of taps to a relevant deal, filter/sort options, search quality, information scent (can I tell from the card if this deal is for me?).

- 1–3: No filters, manual scanning only
- 4–5: Basic search + one toggle
- 6–7: Category filters, cuisine type, price indicators
- 8–9: Smart defaults, personalized sort, "show me cheap tacos near me now"
- 10: Instant, zero-tap relevant results (location + preferences + time = perfect feed)

### 2. Coverage (Weight: 25%)
*Is there always something to show the user, regardless of time/day?*

Measures: total deal count, coverage across hours (morning/lunch/afternoon/evening/late night), coverage across days (weekdays vs weekends), deal type diversity (food vs drinks vs both).

- 1–3: Major dead zones (e.g. nothing after 6pm, bare weekends)
- 4–5: Decent weekday HH coverage, sparse otherwise
- 6–7: Deals available most hours, some weekend coverage, mix of types
- 8–9: Something always available, strong weekend + late night, good variety
- 10: Comprehensive — any time, any day, multiple options in each neighborhood

### 3. Deal Quality (Weight: 20%)
*Are the deals specific, accurate, and actually good value?*

Measures: specific dollar amounts vs vague descriptions, deal attractiveness (would you actually go?), accuracy (is this deal still running?), information completeness (hours, days, what's included).

- 1–3: Mostly vague ("discounted drinks"), unverified, missing info
- 4–5: Mix of specific and vague, some missing details
- 6–7: Most deals have dollar amounts, all have complete info
- 8–9: All deals specific + verified recently, user ratings on deals
- 10: Every deal verified within 30 days, user reviews, "is it worth it?" signal

### 4. Trust & Freshness (Weight: 15%)
*Can I count on these deals being real when I show up?*

Measures: verification recency, user-reported accuracy, dead deal detection, data freshness mechanisms.

- 1–3: No verification dates, no reporting mechanism
- 4–5: Verification dates shown but mostly stale
- 6–7: Recent verification + "report expired" button
- 8–9: Automated re-verification, community reporting, high accuracy rate
- 10: Real-time confirmation, restaurant-managed listings, money-back guarantee

### 5. Completeness (Weight: 10%)
*Does every screen work? Does it feel like a finished product?*

Measures: all nav items functional, no dead ends, empty states handled, onboarding exists, settings/about pages, error handling.

- 1–3: Dead tabs, broken flows, placeholder UI
- 4–5: Core flow works, some dead ends, no onboarding
- 6–7: All visible features work, reasonable empty states, basic onboarding
- 8–9: Polished flows, good error handling, settings, contact/feedback
- 10: Every edge case handled, app store ready, accessibility

### 6. Personalization (Weight: 5%)
*Does the app learn what I like and surface relevant deals?*

Measures: saved preferences, cuisine filters, price sensitivity, location-aware sorting, repeat visit recognition.

- 1–3: Zero personalization, everyone sees the same feed
- 4–5: Basic filters that persist, saved deals
- 6–7: Cuisine preferences, location-based sorting
- 8–9: Learning from behavior, smart recommendations
- 10: "It knows me" — perfect feed with zero effort

---

## Current Score (April 10, 2026)

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Discovery Speed | 25% | 4 | 1.00 |
| Coverage | 25% | 4 | 1.00 |
| Deal Quality | 20% | 5 | 1.00 |
| Trust & Freshness | 15% | 2 | 0.30 |
| Completeness | 10% | 4 | 0.40 |
| Personalization | 5% | 1 | 0.05 |
| **Aggregate** | | | **3.75 / 10** |

### Justifications

**Discovery Speed: 4/10**
- Search works (name, description, neighborhood, category)
- "Available Now" toggle exists
- No category filters (food vs drinks, cuisine type)
- No price sorting or indicators on cards
- No "what's good right now?" smart default

**Coverage: 4/10**
- 76 deals across 3 cities — decent but not deep
- Heavy weekday happy hour bias (4–6pm)
- Added some Taco Tuesday, lunch, late night, Monday specials
- Weekends still very thin
- Nothing before 10am, very little after 9pm

**Deal Quality: 5/10**
- ~60% of deals now have specific dollar amounts
- ~40% still have vague descriptions ("discounted small plates")
- All deals have hours, days, location
- No user ratings on deals themselves
- Some deals may be outdated

**Trust & Freshness: 2/10**
- Most deals show "Last verified: Unknown"
- No mechanism for users to report dead deals
- No automated re-verification
- No way to know if a deal is still running
- One bad experience = user never comes back

**Completeness: 4/10**
- Core browse → detail → directions flow works
- Search works
- Bottom nav has lone "Deals" tab (saved removed)
- No onboarding
- No feedback/contact mechanism
- No about page or branding

**Personalization: 1/10**
- Zero. Everyone sees the same feed in the same order.
- No auth, no saved deals, no preferences.

---

## Score History

| Date | Aggregate | Discovery | Coverage | Quality | Trust | Complete | Personal | Notes |
|---|---|---|---|---|---|---|---|---|
| Apr 10, 2026 | 3.75 | 4 | 4 | 5 | 2 | 4 | 1 | Baseline after 76 deals + search |

---

## Highest-Leverage Improvements

### Tier 1: Biggest impact per effort
1. **Category filter pills** (Discovery +2) — Food / Drinks / Lunch / Happy Hour / Weekly Special. 30 min of work.
2. **More weekend + evening deals** (Coverage +2) — Content effort, not code. Need brunch deals, Saturday specials, date night deals.
3. **Update remaining vague descriptions** (Quality +1) — Research pass on ~30 deals still saying "discounted X."

### Tier 2: High impact, more effort
4. **"Report expired" button on deal detail** (Trust +2) — Simple flag mechanism. Shows we care about accuracy.
5. **Verify all deals with dates** (Trust +1, Quality +1) — Call/check websites for all 76 deals, set last_verified dates.
6. **Auth + saved deals** (Completeness +2, Personalization +1) — Supabase Auth, saved functionality, brings back bottom nav tab.

### Tier 3: Bigger bets
7. **Location-based sorting** (Discovery +1, Personalization +1) — Ask for location, sort by distance.
8. **Cuisine/price tags on deals** (Discovery +2) — Tag each deal with cuisine + price tier, enable filtering.
9. **User deal submissions** (Coverage +2, Trust +1) — Let users submit deals they find. Community-driven growth.
