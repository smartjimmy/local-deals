# Prompt for ChatGPT: South Bay Restaurant Deal Research

I'm building a local food deals app for the South Bay (California). I need you to research and compile restaurant deals for **Palo Alto, Redwood City, and Menlo Park**.

## What I need for each deal:

For each restaurant deal, give me these exact fields in a JSON array so I can paste it directly into my database:

```json
{
  "restaurant_name": "Name of restaurant",
  "deal_description": "Brief description of the deal (1-2 sentences, focus on what you get and the price)",
  "category": "One of: Happy Hour, Brunch, Lunch, Dinner, Drinks",
  "days_of_week": "e.g. Mon, Tue, Wed, Thu, Fri",
  "start_time": "HH:MM:SS format, e.g. 16:00:00",
  "end_time": "HH:MM:SS format, e.g. 18:00:00",
  "address": "Full street address",
  "neighborhood": "One of: Palo Alto, Redwood City, Menlo Park",
  "is_active": true
}
```

## Requirements:

- **Target: 15-20 deals total** across the three cities (roughly even split)
- Focus on **happy hour** and **lunch specials** — these are the most time-sensitive and valuable deals
- Only include deals that are **actually real and currently running** — verify from restaurant websites, Yelp, or Google
- Prioritize deals with **specific prices or discounts** (e.g. "$2 off drafts", "3-course lunch for $25", "half-price wine") over vague ones
- Include the **actual happy hour or lunch special times and days** — don't guess
- Mix of cuisines and price points
- Only include restaurants that are currently open and operating

## Restaurants to specifically look up (known good ones):

**Palo Alto:** The Bird Dog, Vino Locale, Tamarine, Bar Underdog, Horsefeather, San Agus, NOLA, Sekoya, Sun of Wolf, Hidden Tap & Barrel, Delarosa, La Bodeguita Del Medio, Terun Pizza, Local Union 271

**Redwood City:** The Grill House, LV Mar, Angelicas, Nighthawk, Milagros, The Wild Rover, Ghostwood Kitchen, Ocean Oyster Bar

**Menlo Park:** Left Bank, Bistro Vida, Clark's, Menlo Tavern, British Banker's Club, Camper

## Output format:

Give me the complete JSON array ready to paste. Example:

```json
[
  {
    "restaurant_name": "The Grill House",
    "deal_description": "$2 off all appetizers, drafts, wines, and house cocktails.",
    "category": "Happy Hour",
    "days_of_week": "Mon, Tue, Wed, Thu, Fri",
    "start_time": "15:00:00",
    "end_time": "18:00:00",
    "address": "1849 El Camino Real, Redwood City, CA 94063",
    "neighborhood": "Redwood City",
    "is_active": true
  }
]
```

Search restaurant websites and recent reviews to get accurate deal details. If you can't verify a specific deal for a restaurant, skip it rather than making something up.
