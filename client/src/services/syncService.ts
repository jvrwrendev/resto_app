export interface SyncQueueItem {
  id: number;
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'PRODUCT_UPDATED';
  payload: Record<string, unknown>;
  createdAt: string;
}

const _queue: SyncQueueItem[] = [];
let _idCounter = 1;

export const syncService = {
  enqueue(input: { type: SyncQueueItem['type']; [key: string]: unknown }): void {
    const { type, ...rest } = input;
    _queue.push({
      id: _idCounter++,
      type,
      payload: rest as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    });
  },

  pending(): number {
    return _queue.length;
  },

  flush(): SyncQueueItem[] {
    const copy = [..._queue];
    _queue.length = 0;
    return copy;
  },

  peek(): SyncQueueItem[] {
    return [..._queue];
  },
};
