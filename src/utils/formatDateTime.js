export const TZ_MAP = {
  // UTC / GMT
  UTC: 'UTC',
  GMT: 'UTC',

  // India
  IST: 'Asia/Kolkata',

  // Europe
  BST: 'Europe/London',
  CET: 'Europe/Paris',
  CEST: 'Europe/Paris',
  EET: 'Europe/Athens',
  EEST: 'Europe/Athens',
  MSK: 'Europe/Moscow',

  // North America
  EST: 'America/New_York',
  EDT: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  AKST: 'America/Anchorage',
  AKDT: 'America/Anchorage',
  HST: 'Pacific/Honolulu',

  // South America
  BRT: 'America/Sao_Paulo',
  ART: 'America/Argentina/Buenos_Aires',
  CLT: 'America/Santiago',

  // Africa
  WAT: 'Africa/Lagos',
  CAT: 'Africa/Harare',
  EAT: 'Africa/Nairobi',
  SAST: 'Africa/Johannesburg',

  // Middle East
  AST: 'Asia/Riyadh',
  GST: 'Asia/Dubai',
  IRST: 'Asia/Tehran',

  // Asia
  PKT: 'Asia/Karachi',
  AFT: 'Asia/Kabul',
  BDT: 'Asia/Dhaka',
  NPT: 'Asia/Kathmandu',
  LKT: 'Asia/Colombo',
  MMT: 'Asia/Yangon',
  ICT: 'Asia/Bangkok',
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura',
  CST_CN: 'Asia/Shanghai',
  HKT: 'Asia/Hong_Kong',
  TWT: 'Asia/Taipei',
  JST: 'Asia/Tokyo',
  KST: 'Asia/Seoul',
  SGT: 'Asia/Singapore',

  // Australia / NZ
  AWST: 'Australia/Perth',
  ACST: 'Australia/Adelaide',
  AEST: 'Australia/Sydney',
  AEDT: 'Australia/Sydney',
  NZST: 'Pacific/Auckland',
  NZDT: 'Pacific/Auckland',

  // Pacific
  SST: 'Pacific/Guadalcanal',
  FJT: 'Pacific/Fiji',
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const day = date.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? 'st'
      : day === 2 || day === 22
        ? 'nd'
        : day === 3 || day === 23
          ? 'rd'
          : 'th';
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
};

export const formatDateTime = (dateString, timezone) => {
  const timeZone = TZ_MAP?.[timezone];

  if (!timeZone) {
    console.warn(`Unknown timezone code: ${timezone}`);
    return '';
  }

  const formattedDateTimeString = new Intl.DateTimeFormat('en-US', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString));

  return `${formattedDateTimeString} ${timezone}`;
};
