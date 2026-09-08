import { Filter, X } from 'lucide-react';
import { SearchableSelect } from './ui/SearchableSelect';
import { Button } from './ui';

export interface ClassSectionFilterOptions {
  classNames: string[];
  sections: string[];
  sectionsByClass: Record<string, string[]>;
  countsByClass?: Record<string, number>;
  countsByClassSection?: Record<string, Record<string, number>>;
  countsBySection?: Record<string, number>;
}

interface ClassSectionFilterProps {
  classFilter: string;
  sectionFilter: string;
  options?: ClassSectionFilterOptions;
  isLoading?: boolean;
  onClassChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onClear: () => void;
}

function formatCount(n: number | undefined): string {
  if (!n) return '';
  return ` (${n})`;
}

export function ClassSectionFilter({
  classFilter,
  sectionFilter,
  options,
  isLoading,
  onClassChange,
  onSectionChange,
  onClear,
}: ClassSectionFilterProps) {
  const classNames = options?.classNames ?? [];
  const allSections = options?.sections ?? [];
  const sectionsForClass = classFilter
    ? (options?.sectionsByClass?.[classFilter] ?? [])
    : allSections;

  const hasActiveFilter = Boolean(classFilter || sectionFilter);
  const hasOptions = classNames.length > 0 || hasActiveFilter;

  if (!hasOptions && !isLoading) return null;

  const classOptions = [
    { value: '', label: 'All classes' },
    ...classNames.map((name) => ({
      value: name,
      label: `${name}${formatCount(options?.countsByClass?.[name])}`,
    })),
  ];

  const sectionOptions = [
    { value: '', label: 'All sections' },
    ...sectionsForClass.map((sec) => {
      const count = classFilter
        ? options?.countsByClassSection?.[classFilter]?.[sec]
        : options?.countsBySection?.[sec];
      return {
        value: sec,
        label: `Section ${sec}${formatCount(count)}`,
      };
    }),
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="h-4 w-4 text-gray-400" />
          Filter by class / section
        </div>
        {hasActiveFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 rounded-lg px-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Class</label>
          <SearchableSelect
            options={classOptions}
            value={classFilter}
            onChange={(value) => onClassChange(value || '')}
            placeholder="All classes"
            disabled={isLoading || classNames.length === 0}
            searchable
            className="[&_button]:h-11 [&_button]:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Section</label>
          <SearchableSelect
            options={sectionOptions}
            value={sectionFilter}
            onChange={(value) => onSectionChange(value || '')}
            placeholder="All sections"
            disabled={isLoading || sectionsForClass.length === 0}
            searchable={sectionsForClass.length > 5}
            className="[&_button]:h-11 [&_button]:text-sm"
          />
        </div>
      </div>

      {hasActiveFilter && (
        <div className="flex flex-wrap gap-2 pt-1">
          {classFilter && (
            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {classFilter}
              {options?.countsByClass?.[classFilter]
                ? ` · ${options.countsByClass[classFilter]} students`
                : ''}
            </span>
          )}
          {sectionFilter && (
            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              Section {sectionFilter}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
