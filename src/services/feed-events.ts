// Tiny pub-sub so screens can tell the feed to refresh (e.g. after creating a post)
// without reloading on every focus and losing the scroll position.
type Listener = () => void;

const listeners = new Set<Listener>();

export function onFeedChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitFeedChanged(): void {
  listeners.forEach((listener) => listener());
}
