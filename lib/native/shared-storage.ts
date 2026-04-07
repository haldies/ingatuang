// Siri Shortcut logic removed (Build-Safe)
export interface ShortcutQueueEntry {
  id: string;
  amount: number;
}

export const sharedStorage = {
  getQueue(): ShortcutQueueEntry[] { return []; },
  clearQueue(): void {}
};
