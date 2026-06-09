// Pusher configuration for Analytics Chat Widget
// Now uses app's centralized config
import { PUSHER_KEY, PUSHER_CLUSTER } from '../../../config';

// No-op for backwards compatibility - config is now automatic
export function setPusherConfig() {}

export function getPusherKey() {
  return PUSHER_KEY;
}

export function getPusherCluster() {
  return PUSHER_CLUSTER;
}
