import { useDataStore } from "../data/store";

export function useEvents() {
  return useDataStore().events;
}

export function useOpportunities() {
  return useDataStore().opportunities;
}

export function useEvent(id: string | undefined) {
  return useDataStore().events.find((e) => e.id === id);
}

export function useOpportunity(id: string | undefined) {
  return useDataStore().opportunities.find((o) => o.id === id);
}

/**
 * True while the listings store is still doing its first fetch.
 * Detail pages must wait for this before showing a "not found" state,
 * otherwise they flash the error before the data arrives.
 */
export function useListingsLoading() {
  return useDataStore().loading;
}
