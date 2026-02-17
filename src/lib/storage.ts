import { BacklogItem, GeneratorRun, ValidationReport } from './types';

const KEYS = {
  generatorRuns: 'ideaforge_generator_runs',
  validationReports: 'ideaforge_validation_reports',
  backlog: 'ideaforge_backlog',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Generator Runs
export const getGeneratorRuns = (): GeneratorRun[] => get(KEYS.generatorRuns, []);
export const saveGeneratorRun = (run: GeneratorRun) => {
  const runs = getGeneratorRuns();
  runs.unshift(run);
  set(KEYS.generatorRuns, runs);
};

// Validation Reports
export const getValidationReports = (): ValidationReport[] => get(KEYS.validationReports, []);
export const saveValidationReport = (report: ValidationReport) => {
  const reports = getValidationReports();
  reports.unshift(report);
  set(KEYS.validationReports, reports);
};

// Backlog
export const getBacklog = (): BacklogItem[] => get(KEYS.backlog, []);
export const addToBacklog = (item: BacklogItem) => {
  const backlog = getBacklog();
  backlog.unshift(item);
  set(KEYS.backlog, backlog);
};
export const updateBacklogStatus = (id: string, status: BacklogItem['status']) => {
  const backlog = getBacklog();
  const idx = backlog.findIndex(i => i.id === id);
  if (idx >= 0) { backlog[idx].status = status; set(KEYS.backlog, backlog); }
};
export const addNoteToBacklog = (id: string, note: string) => {
  const backlog = getBacklog();
  const idx = backlog.findIndex(i => i.id === id);
  if (idx >= 0) {
    if (!backlog[idx].notes) backlog[idx].notes = [];
    backlog[idx].notes.unshift(note);
    set(KEYS.backlog, backlog);
  }
};
export const removeFromBacklog = (id: string) => {
  set(KEYS.backlog, getBacklog().filter(i => i.id !== id));
};

// Stats
export const getStats = () => ({
  ideasGenerated: getGeneratorRuns().reduce((sum, r) => sum + r.ideaSuggestions.length, 0),
  ideasValidated: getValidationReports().length,
  ideasInBacklog: getBacklog().length,
});

// Export
export const exportData = () => {
  const data = {
    generatorRuns: getGeneratorRuns(),
    validationReports: getValidationReports(),
    backlog: getBacklog(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ideaforge-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
