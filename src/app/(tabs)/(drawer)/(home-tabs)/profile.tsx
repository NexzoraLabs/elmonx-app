import { Redirect } from 'expo-router';

/**
 * The Profile tab press is intercepted in the tab layout and pushes
 * /account instead. This is a defensive fallback in case the route is
 * ever reached directly (e.g. a deep link).
 */
export default function ProfileTabScreen() {
  return <Redirect href="/account" />;
}
