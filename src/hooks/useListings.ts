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
