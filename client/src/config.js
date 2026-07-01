// Single place to re-skin the app for a different business.
export const business = {
  name: 'Cedar & Co.',
  tagline: 'Book your appointment in seconds.',
  blurb:
    'Pick a service, choose a time that works for you, and get an instant confirmation. No phone tag, no waiting.',
  // Should match the server's BUSINESS_TIMEZONE. Used only for the date
  // picker's default/min; the API is the source of truth for slot times.
  timezone: 'America/New_York',
};
