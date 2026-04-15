import { ScrollView, Text, StyleSheet } from 'react-native';

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: April 14, 2026</Text>

      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.body}>
        Local Deals ("we", "our", or "the app") helps you discover restaurant
        deals near you. We take your privacy seriously and are committed to
        protecting your personal information.
      </Text>

      <Text style={styles.heading}>Location Data</Text>
      <Text style={styles.body}>
        Local Deals requests access to your device's location to sort nearby
        deals by distance. Your location data is processed entirely on your
        device and is never sent to our servers, stored, or shared with third
        parties. You can deny location access at any time through your device
        settings; the app will still function but deals will not be sorted by
        proximity.
      </Text>

      <Text style={styles.heading}>Authentication</Text>
      <Text style={styles.body}>
        If you sign in with Google, we receive your name and email address from
        Google. This information is stored securely in our authentication
        provider (Supabase) and is used solely to identify your account. We do
        not sell or share your account information.
      </Text>

      <Text style={styles.heading}>Data We Collect</Text>
      <Text style={styles.body}>
        Apart from optional account information and on-device location
        processing, Local Deals does not collect, store, or transmit any
        personal data. We do not use analytics trackers, advertising SDKs, or
        any third-party data collection tools.
      </Text>

      <Text style={styles.heading}>Third-Party Services</Text>
      <Text style={styles.body}>
        Local Deals uses Supabase for data storage and authentication, and
        Google Places for restaurant information. These services have their own
        privacy policies that govern their handling of data.
      </Text>

      <Text style={styles.heading}>Children's Privacy</Text>
      <Text style={styles.body}>
        Local Deals is not directed at children under 13. We do not knowingly
        collect personal information from children under 13.
      </Text>

      <Text style={styles.heading}>Changes to This Policy</Text>
      <Text style={styles.body}>
        We may update this policy from time to time. Any changes will be
        reflected on this page with an updated date.
      </Text>

      <Text style={styles.heading}>Contact</Text>
      <Text style={styles.body}>
        If you have questions about this privacy policy, contact us at
        jimmyjameskang@gmail.com.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1a1a2e',
  },
  updated: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    color: '#1a1a2e',
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
});
