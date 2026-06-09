export const TIMEZONE_MAP = {
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  IST: 'Asia/Kolkata',
  UTC: 'UTC',
  GMT: 'UTC',
};

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

export const getIANATimezone = (timezone) => {
  return TIMEZONE_MAP[timezone] || 'America/Los_Angeles';
};

export const formatTime = (timestamp, timezone = 'PST') => {
  if (!timestamp) return '--';
  const ianaTimezone = getIANATimezone(timezone);

  return new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
};

export const formatDateTime = (timestamp, timezone = 'PST') => {
  if (!timestamp) return '--';
  const ianaTimezone = getIANATimezone(timezone);

  return new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
};

export const formatRelativeTime = (timestamp, timezone = 'PST') => {
  if (!timestamp) return '-';

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return `Yesterday at ${formatTime(timestamp, timezone)}`;
  if (days < 7) return `${days} days ago`;

  return formatDateTime(timestamp, timezone);
};

export const formatRecords = (records) => {
  if (records === undefined || records === null) return '--';
  return records.toLocaleString();
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const isAssociationObject = (name) => {
  return name?.includes('_ASSOCIATION') || name?.includes('ASSOCIATION');
};

export const formatObjectName = (name) => {
  if (!name) return name;
  return name
    .split('_')
    .map((w) => capitalize(w.toLowerCase()))
    .join(' ');
};

export const formatAssociationName = (name, allObjectNames) => {
  if (!isAssociationObject(name)) return formatObjectName(name);

  const toMatch = name.match(/^([A-Z]+)_TO_([A-Z]+)_ASSOCIATION$/);
  if (toMatch) {
    const from = capitalize(toMatch[1].toLowerCase());
    const to = capitalize(toMatch[2].toLowerCase());
    return `${from} to ${to} Links`;
  }

  const numMatch = name.match(/^([A-Z]+)_(\d+)_ASSOCIATION$/);
  if (numMatch) {
    const objectType = capitalize(numMatch[1].toLowerCase());
    const num = numMatch[2];

    const sameTypeCount = allObjectNames.filter((n) =>
      n.match(new RegExp(`^${numMatch[1]}_\\d+_ASSOCIATION$`))
    ).length;

    if (sameTypeCount > 1) {
      return `${objectType} Links ${num}`;
    }
    return `${objectType} Links`;
  }

  return name
    .replace(/_ASSOCIATION$/, ' Links')
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => capitalize(w.toLowerCase()))
    .join(' ');
};

export const formatTableNameForTooltip = (tableName) => {
  const cleaned = tableName
    .replace(/^hubspot_/, '')
    .replace(/^salesforce_/, '')
    .replace(/_association$/, '');

  const parts = cleaned.split('_to_');
  if (parts.length === 2) {
    const from = capitalize(parts[0].replace(/_/g, ' '));
    const to = capitalize(parts[1].replace(/_/g, ' '));
    return `${from} ↔ ${to}`;
  }

  return cleaned.replace(/_/g, ' ').split(' ').map(capitalize).join(' ');
};

export const getEmptyStateType = (connectedIntegrations, sessionsResponse) => {
  if (!connectedIntegrations?.length) {
    return 'NO_INTEGRATIONS';
  }

  if (sessionsResponse?.data?.length === 0 && sessionsResponse?.total === 0) {
    return 'NO_SESSIONS_IN_RANGE';
  }

  return 'HAS_DATA';
};
