import { generateId } from './helpers';

// ── Publisher Sample Data ──
export const SAMPLE_PUBLISHERS = [
  {
    id: generateId(), domain: 'techinsider.com', url: 'https://techinsider.com',
    country: 'USA', language: 'English', dr: 72, da: 68, organicTraffic: 480000,
    referringDomains: 3200, backlinks: 95000, spamScore: 2,
    niche: 'Technology', top5Topics: 'AI, SaaS, Startups, Gadgets, Cloud',
    linkType: 'Guest Post', sellerPrice: 280, clientPrice: 450,
    profit: 170, primaryContact: 'James Harper', email: 'james@techinsider.com',
    whatsapp: '+1-555-0191', status: 'Active', lastUpdated: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'Quick turnaround, great niche. Prefer 1000+ word articles.'
  },
  {
    id: generateId(), domain: 'healthlinehub.co.uk', url: 'https://healthlinehub.co.uk',
    country: 'UK', language: 'English', dr: 58, da: 52, organicTraffic: 220000,
    referringDomains: 1100, backlinks: 34000, spamScore: 4,
    niche: 'Health', top5Topics: 'Fitness, Nutrition, Mental Health, Wellness, Diet',
    linkType: 'Niche Edit', sellerPrice: 120, clientPrice: 210,
    profit: 90, primaryContact: 'Olivia Bennett', email: 'olivia@healthlinehub.co.uk',
    whatsapp: '+44-7700-900123', status: 'Verified',
    lastUpdated: new Date(Date.now() - 5 * 86400000).toISOString(),
    notes: 'DoFollow only, no casino or pharma niches.'
  },
  {
    id: generateId(), domain: 'financedaily.ca', url: 'https://financedaily.ca',
    country: 'Canada', language: 'English', dr: 64, da: 59, organicTraffic: 310000,
    referringDomains: 2100, backlinks: 61000, spamScore: 1,
    niche: 'Finance', top5Topics: 'Investing, Crypto, Budgeting, Taxes, Banking',
    linkType: 'Sponsored Post', sellerPrice: 350, clientPrice: 580,
    profit: 230, primaryContact: 'Liam Tremblay', email: 'liam@financedaily.ca',
    whatsapp: '+1-416-555-0342', status: 'Active',
    lastUpdated: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'Excellent DA, very responsive team. Payment via PayPal.'
  },
  {
    id: generateId(), domain: 'dubaipropertyguide.ae', url: 'https://dubaipropertyguide.ae',
    country: 'UAE', language: 'English', dr: 45, da: 41, organicTraffic: 85000,
    referringDomains: 620, backlinks: 12000, spamScore: 5,
    niche: 'Real Estate', top5Topics: 'Dubai Properties, Investment, Villas, Apartments, ROI',
    linkType: 'Guest Post', sellerPrice: 180, clientPrice: 320,
    profit: 140, primaryContact: 'Ahmed Al-Farsi', email: 'ahmed@dubaipropertyguide.ae',
    whatsapp: '+971-50-555-0198', status: 'Active',
    lastUpdated: new Date(Date.now() - 7 * 86400000).toISOString(),
    notes: 'Strong local SEO presence. Arabic content available.'
  },
  {
    id: generateId(), domain: 'aussiebizreview.com.au', url: 'https://aussiebizreview.com.au',
    country: 'Australia', language: 'English', dr: 51, da: 48, organicTraffic: 140000,
    referringDomains: 890, backlinks: 21000, spamScore: 3,
    niche: 'Business', top5Topics: 'SMB, Entrepreneurship, Marketing, Finance, Legal',
    linkType: 'Resource Page', sellerPrice: 220, clientPrice: 380,
    profit: 160, primaryContact: 'Sophie Clarke', email: 'sophie@aussiebizreview.com.au',
    whatsapp: '+61-400-555-071', status: 'Verified',
    lastUpdated: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: 'Very clean backlink profile. No spammy anchor restrictions.'
  },
  {
    id: generateId(), domain: 'techbazaar.in', url: 'https://techbazaar.in',
    country: 'India', language: 'English', dr: 38, da: 35, organicTraffic: 620000,
    referringDomains: 540, backlinks: 18000, spamScore: 8,
    niche: 'Technology', top5Topics: 'Mobile, Apps, E-commerce, Startups, Gadgets',
    linkType: 'Guest Post', sellerPrice: 60, clientPrice: 120,
    profit: 60, primaryContact: 'Rahul Sharma', email: 'rahul@techbazaar.in',
    whatsapp: '+91-98765-43210', status: 'Active',
    lastUpdated: new Date(Date.now() - 10 * 86400000).toISOString(),
    notes: 'Very high traffic. Moderate domain authority. Good for volume.'
  },
  {
    id: generateId(), domain: 'digitalpakistan.pk', url: 'https://digitalpakistan.pk',
    country: 'Pakistan', language: 'English', dr: 30, da: 28, organicTraffic: 95000,
    referringDomains: 310, backlinks: 8500, spamScore: 6,
    niche: 'Technology', top5Topics: 'IT, SaaS, Freelancing, E-commerce, Startups',
    linkType: 'Guest Post', sellerPrice: 40, clientPrice: 90,
    profit: 50, primaryContact: 'Usman Khan', email: 'usman@digitalpakistan.pk',
    whatsapp: '+92-300-1234567', status: 'Active',
    lastUpdated: new Date(Date.now() - 4 * 86400000).toISOString(),
    notes: 'Budget-friendly. Good for regional outreach campaigns.'
  },
  {
    id: generateId(), domain: 'travelwithme.us', url: 'https://travelwithme.us',
    country: 'USA', language: 'English', dr: 55, da: 50, organicTraffic: 190000,
    referringDomains: 1400, backlinks: 42000, spamScore: 2,
    niche: 'Travel', top5Topics: 'Destinations, Hotels, Budget Travel, Guides, Visas',
    linkType: 'Niche Edit', sellerPrice: 150, clientPrice: 270,
    profit: 120, primaryContact: 'Emma Wilson', email: 'emma@travelwithme.us',
    whatsapp: '+1-305-555-0187', status: 'Verified',
    lastUpdated: new Date(Date.now() - 6 * 86400000).toISOString(),
    notes: 'Great for travel brands. 800 word minimum for guest posts.'
  },
  {
    id: generateId(), domain: 'cryptovault.co.uk', url: 'https://cryptovault.co.uk',
    country: 'UK', language: 'English', dr: 49, da: 44, organicTraffic: 170000,
    referringDomains: 780, backlinks: 25000, spamScore: 7,
    niche: 'Finance', top5Topics: 'Crypto, DeFi, NFT, Web3, Blockchain',
    linkType: 'Sponsored Post', sellerPrice: 300, clientPrice: 520,
    profit: 220, primaryContact: 'Alex Turner', email: 'alex@cryptovault.co.uk',
    whatsapp: '+44-7900-456123', status: 'Expensive',
    lastUpdated: new Date(Date.now() - 12 * 86400000).toISOString(),
    notes: 'High price but strong authority in crypto niche.'
  },
  {
    id: generateId(), domain: 'ecommercepros.ca', url: 'https://ecommercepros.ca',
    country: 'Canada', language: 'English', dr: 43, da: 40, organicTraffic: 88000,
    referringDomains: 520, backlinks: 14000, spamScore: 3,
    niche: 'E-commerce', top5Topics: 'Shopify, WooCommerce, Dropshipping, SEO, Conversion',
    linkType: 'Guest Post', sellerPrice: 160, clientPrice: 290,
    profit: 130, primaryContact: 'Mia Johnson', email: 'mia@ecommercepros.ca',
    whatsapp: '+1-647-555-0234', status: 'Active',
    lastUpdated: new Date(Date.now() - 8 * 86400000).toISOString(),
    notes: 'Focused on Shopify ecosystem. Great for e-commerce clients.'
  },
  {
    id: generateId(), domain: 'legaladvice360.com.au', url: 'https://legaladvice360.com.au',
    country: 'Australia', language: 'English', dr: 39, da: 36, organicTraffic: 62000,
    referringDomains: 290, backlinks: 7800, spamScore: 2,
    niche: 'Legal', top5Topics: 'Business Law, Property, Employment, Family Law, Immigration',
    linkType: 'Resource Page', sellerPrice: 200, clientPrice: 360,
    profit: 160, primaryContact: 'Ryan Mitchell', email: 'ryan@legaladvice360.com.au',
    whatsapp: '+61-450-555-090', status: 'Inactive',
    lastUpdated: new Date(Date.now() - 20 * 86400000).toISOString(),
    notes: 'Currently not accepting new placements. Check back next month.'
  },
  {
    id: generateId(), domain: 'fitnessfreakz.in', url: 'https://fitnessfreakz.in',
    country: 'India', language: 'English', dr: 32, da: 30, organicTraffic: 380000,
    referringDomains: 220, backlinks: 9200, spamScore: 9,
    niche: 'Health', top5Topics: 'Gym, Yoga, Diet, Supplements, Weight Loss',
    linkType: 'Guest Post', sellerPrice: 50, clientPrice: 100,
    profit: 50, primaryContact: 'Priya Patel', email: 'priya@fitnessfreakz.in',
    whatsapp: '+91-99876-54321', status: 'Active',
    lastUpdated: new Date(Date.now() - 14 * 86400000).toISOString(),
    notes: 'Very high traffic but spam score is elevated. Use cautiously.'
  },
  {
    id: generateId(), domain: 'seospecialists.pk', url: 'https://seospecialists.pk',
    country: 'Pakistan', language: 'English', dr: 25, da: 23, organicTraffic: 45000,
    referringDomains: 180, backlinks: 5500, spamScore: 11,
    niche: 'SEO', top5Topics: 'Link Building, On-page SEO, Technical SEO, Content, Tools',
    linkType: 'Guest Post', sellerPrice: 30, clientPrice: 70,
    profit: 40, primaryContact: 'Bilal Ahmed', email: 'bilal@seospecialists.pk',
    whatsapp: '+92-321-9876543', status: 'Blacklisted',
    lastUpdated: new Date(Date.now() - 30 * 86400000).toISOString(),
    notes: 'Blacklisted due to link selling to PBN networks. Do not use.'
  },
  {
    id: generateId(), domain: 'digitalnomadlife.com', url: 'https://digitalnomadlife.com',
    country: 'USA', language: 'English', dr: 61, da: 56, organicTraffic: 250000,
    referringDomains: 1900, backlinks: 55000, spamScore: 1,
    niche: 'Lifestyle', top5Topics: 'Remote Work, Travel, Tools, Productivity, Freelancing',
    linkType: 'Niche Edit', sellerPrice: 190, clientPrice: 330,
    profit: 140, primaryContact: 'Jake Morris', email: 'jake@digitalnomadlife.com',
    whatsapp: '+1-415-555-0267', status: 'Verified',
    lastUpdated: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'Clean site. Excellent for SaaS tools and remote work brands.'
  },
  {
    id: generateId(), domain: 'businessweekly.ae', url: 'https://businessweekly.ae',
    country: 'UAE', language: 'English', dr: 52, da: 47, organicTraffic: 130000,
    referringDomains: 870, backlinks: 28000, spamScore: 3,
    niche: 'Business', top5Topics: 'UAE Market, Investments, Fintech, Entrepreneurship, Logistics',
    linkType: 'Sponsored Post', sellerPrice: 250, clientPrice: 430,
    profit: 180, primaryContact: 'Sara Al-Mansouri', email: 'sara@businessweekly.ae',
    whatsapp: '+971-55-555-0123', status: 'No Response',
    lastUpdated: new Date(Date.now() - 15 * 86400000).toISOString(),
    notes: 'Good site but contact went silent after initial discussion.'
  },
];

// ── Lead Sample Data ──
export const SAMPLE_LEADS = [
  {
    id: generateId(), website: 'shopifystore.com', country: 'USA', niche: 'E-commerce',
    dr: 42, organicTraffic: 85000, avgSerpPosition: 18,
    email: 'hello@shopifystore.com', phone: '+1-888-555-0101',
    lastContacted: new Date(Date.now() - 3 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'Interested', notes: 'Looking for guest posts in their niche. Budget ~$400/month.'
  },
  {
    id: generateId(), website: 'londonlegalfirm.co.uk', country: 'UK', niche: 'Legal',
    dr: 55, organicTraffic: 62000, avgSerpPosition: 24,
    email: 'seo@londonlegalfirm.co.uk', phone: '+44-7800-123456',
    lastContacted: new Date(Date.now() - 10 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() - 1 * 86400000).toISOString(), // overdue
    status: 'Follow-up', notes: 'Interested in niche edits only. Follow up ASAP.'
  },
  {
    id: generateId(), website: 'torontorealestate.ca', country: 'Canada', niche: 'Real Estate',
    dr: 48, organicTraffic: 110000, avgSerpPosition: 15,
    email: 'marketing@torontorealestate.ca', phone: '+1-416-555-0300',
    lastContacted: new Date(Date.now() - 5 * 86400000).toISOString(),
    followUpDate: new Date().toISOString(), // due today
    status: 'Contacted', notes: 'Replied to initial email, waiting for pricing discussion.'
  },
  {
    id: generateId(), website: 'dubaifinance.ae', country: 'UAE', niche: 'Finance',
    dr: 38, organicTraffic: 55000, avgSerpPosition: 31,
    email: 'info@dubaifinance.ae', phone: '+971-50-123-4567',
    lastContacted: null, followUpDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: 'New', notes: 'Found through SERP analysis. Yet to contact.'
  },
  {
    id: generateId(), website: 'melbournehealth.com.au', country: 'Australia', niche: 'Health',
    dr: 45, organicTraffic: 78000, avgSerpPosition: 20,
    email: 'team@melbournehealth.com.au', phone: '+61-420-555-090',
    lastContacted: new Date(Date.now() - 20 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() - 5 * 86400000).toISOString(), // overdue
    status: 'Abandoned', notes: 'No response after 3 follow-ups. Marked abandoned.'
  },
  {
    id: generateId(), website: 'startupkarachi.pk', country: 'Pakistan', niche: 'Business',
    dr: 22, organicTraffic: 32000, avgSerpPosition: 45,
    email: 'founder@startupkarachi.pk', phone: '+92-333-1234567',
    lastContacted: new Date(Date.now() - 2 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'Contacted', notes: 'Budget is low. Targeting local SEO services.'
  },
  {
    id: generateId(), website: 'cryptoinvestor.us', country: 'USA', niche: 'Finance',
    dr: 58, organicTraffic: 200000, avgSerpPosition: 12,
    email: 'seo@cryptoinvestor.us', phone: '+1-415-555-0199',
    lastContacted: new Date(Date.now() - 1 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'Interested', notes: 'Very hot lead. Looking for DR50+ placements in crypto.'
  },
  {
    id: generateId(), website: 'manchesterfood.co.uk', country: 'UK', niche: 'Food & Lifestyle',
    dr: 35, organicTraffic: 48000, avgSerpPosition: 28,
    email: 'hello@manchesterfood.co.uk', phone: '+44-7900-654321',
    lastContacted: null, followUpDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'New', notes: 'Potential for lifestyle and travel crossover placements.'
  },
  {
    id: generateId(), website: 'calgarybusiness.ca', country: 'Canada', niche: 'Business',
    dr: 41, organicTraffic: 67000, avgSerpPosition: 22,
    email: 'marketing@calgarybusiness.ca', phone: '+1-403-555-0222',
    lastContacted: new Date(Date.now() - 8 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: 'Follow-up', notes: 'Asked for a proposal. Need to send before end of week.'
  },
  {
    id: generateId(), website: 'sydneytech.com.au', country: 'Australia', niche: 'Technology',
    dr: 50, organicTraffic: 95000, avgSerpPosition: 17,
    email: 'growth@sydneytech.com.au', phone: '+61-430-555-100',
    lastContacted: new Date(Date.now() - 4 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'Contacted', notes: 'Interested in quarterly retainer for link building.'
  },
  {
    id: generateId(), website: 'lahorefashion.pk', country: 'Pakistan', niche: 'Fashion',
    dr: 18, organicTraffic: 25000, avgSerpPosition: 52,
    email: 'info@lahorefashion.pk', phone: '+92-42-555-6789',
    lastContacted: null, followUpDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: 'New', notes: 'Small brand, low authority. Not a priority.'
  },
  {
    id: generateId(), website: 'nycdigital.com', country: 'USA', niche: 'Marketing',
    dr: 63, organicTraffic: 280000, avgSerpPosition: 9,
    email: 'links@nycdigital.com', phone: '+1-212-555-0187',
    lastContacted: new Date(Date.now() - 7 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() - 2 * 86400000).toISOString(), // overdue
    status: 'Follow-up', notes: 'Large agency. Could be recurring client. Overdue for follow-up.'
  },
  {
    id: generateId(), website: 'scottishedu.co.uk', country: 'UK', niche: 'Education',
    dr: 60, organicTraffic: 145000, avgSerpPosition: 11,
    email: 'partnerships@scottishedu.co.uk', phone: '+44-7700-876543',
    lastContacted: new Date(Date.now() - 15 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() - 8 * 86400000).toISOString(), // overdue
    status: 'Abandoned', notes: 'Their team changed. Start fresh outreach.'
  },
  {
    id: generateId(), website: 'abudhabirealty.ae', country: 'UAE', niche: 'Real Estate',
    dr: 44, organicTraffic: 72000, avgSerpPosition: 19,
    email: 'digital@abudhabirealty.ae', phone: '+971-56-555-0234',
    lastContacted: new Date(Date.now() - 3 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    status: 'Interested', notes: 'Looking for 5-10 placements per month across real estate sites.'
  },
  {
    id: generateId(), website: 'mumbaifintech.in', country: 'India', niche: 'Finance',
    dr: 47, organicTraffic: 130000, avgSerpPosition: 16,
    email: 'seo@mumbaifintech.in', phone: '+91-98765-12340',
    lastContacted: new Date(Date.now() - 6 * 86400000).toISOString(),
    followUpDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'Contacted', notes: 'Interested in high-authority placements. Has decent budget.'
  },
];

// ── Activity Log Seeds ──
export const SAMPLE_ACTIVITY = [
  { id: generateId(), type: 'publisher_added', message: 'Added publisher techinsider.com', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: generateId(), type: 'lead_added', message: 'New lead: shopifystore.com added to CRM', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: generateId(), type: 'lead_contacted', message: 'Contacted torontorealestate.ca via email', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: generateId(), type: 'publisher_updated', message: 'Updated status of cryptovault.co.uk to Expensive', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: generateId(), type: 'followup_scheduled', message: 'Follow-up scheduled for calgarybusiness.ca', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: generateId(), type: 'publisher_added', message: 'Added publisher financedaily.ca', timestamp: new Date(Date.now() - 30 * 3600000).toISOString() },
  { id: generateId(), type: 'lead_interested', message: 'cryptoinvestor.us marked as Interested', timestamp: new Date(Date.now() - 36 * 3600000).toISOString() },
  { id: generateId(), type: 'publisher_updated', message: 'seospecialists.pk marked as Blacklisted', timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: generateId(), type: 'lead_added', message: 'New lead: dubaifinance.ae discovered from SERP', timestamp: new Date(Date.now() - 52 * 3600000).toISOString() },
  { id: generateId(), type: 'publisher_added', message: 'Added publisher digitalnomadlife.com', timestamp: new Date(Date.now() - 60 * 3600000).toISOString() },
];
