import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '../src/stores/filterStore';

describe('Shared Filter Store with Selectors (Requirement 5.4 & 10)', () => {
  beforeEach(() => {
    useFilterStore.getState().resetFilters();
  });

  it('should initialize with default filter state', () => {
    const state = useFilterStore.getState();
    expect(state.courseId).toBe('all');
    expect(state.status).toBe('all');
    expect(state.searchQuery).toBe('');
    expect(state.sortBy).toBe('dueAsc');
  });

  it('should update course filter and reflect in state', () => {
    useFilterStore.getState().setCourseId('course-123');
    expect(useFilterStore.getState().courseId).toBe('course-123');
  });

  it('should update status filter (pending / completed)', () => {
    useFilterStore.getState().setStatus('pending');
    expect(useFilterStore.getState().status).toBe('pending');

    useFilterStore.getState().setStatus('completed');
    expect(useFilterStore.getState().status).toBe('completed');
  });

  it('should update search query', () => {
    useFilterStore.getState().setSearchQuery('báo cáo cuối kỳ');
    expect(useFilterStore.getState().searchQuery).toBe('báo cáo cuối kỳ');
  });

  it('should update sort options', () => {
    useFilterStore.getState().setSortBy('dueDesc');
    expect(useFilterStore.getState().sortBy).toBe('dueDesc');

    useFilterStore.getState().setSortBy('createdDesc');
    expect(useFilterStore.getState().sortBy).toBe('createdDesc');
  });

  it('should reset all filters back to defaults on resetFilters()', () => {
    useFilterStore.getState().setCourseId('c-99');
    useFilterStore.getState().setStatus('completed');
    useFilterStore.getState().setSearchQuery('test query');
    useFilterStore.getState().setSortBy('dueDesc');

    useFilterStore.getState().resetFilters();

    const state = useFilterStore.getState();
    expect(state.courseId).toBe('all');
    expect(state.status).toBe('all');
    expect(state.searchQuery).toBe('');
    expect(state.sortBy).toBe('dueAsc');
  });
});
