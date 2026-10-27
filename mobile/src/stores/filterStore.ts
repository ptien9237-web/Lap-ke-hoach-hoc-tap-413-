import { create } from 'zustand';

interface FilterState {
  courseId: string | 'all';
  status: 'all' | 'pending' | 'completed';
  searchQuery: string;
  sortBy: 'dueAsc' | 'dueDesc' | 'createdDesc';

  // Actions
  setCourseId: (courseId: string | 'all') => void;
  setStatus: (status: 'all' | 'pending' | 'completed') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'dueAsc' | 'dueDesc' | 'createdDesc') => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  courseId: 'all',
  status: 'all',
  searchQuery: '',
  sortBy: 'dueAsc',

  setCourseId: (courseId) => set({ courseId }),
  setStatus: (status) => set({ status }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () => set({
    courseId: 'all',
    status: 'all',
    searchQuery: '',
    sortBy: 'dueAsc',
  }),
}));

// --- SELECTORS ---
export const selectCourseIdFilter = (state: FilterState) => state.courseId;
export const selectStatusFilter = (state: FilterState) => state.status;
export const selectSearchQuery = (state: FilterState) => state.searchQuery;
export const selectSortBy = (state: FilterState) => state.sortBy;
export const selectIsAnyFilterActive = (state: FilterState) =>
  state.courseId !== 'all' || state.status !== 'all' || state.searchQuery.trim().length > 0;

export const useCourseIdFilter = () => useFilterStore(selectCourseIdFilter);
export const useStatusFilter = () => useFilterStore(selectStatusFilter);
export const useSearchQueryFilter = () => useFilterStore(selectSearchQuery);
export const useSortByFilter = () => useFilterStore(selectSortBy);
export const useIsAnyFilterActive = () => useFilterStore(selectIsAnyFilterActive);
