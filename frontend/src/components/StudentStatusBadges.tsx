/** Renders screening + mental health status for student list cards. */
export function StudentStatusBadges({ status }: { status: any }) {
  const submitted = !!(status?.isComplete);
  const physicalDone = !!(status?.screeningComplete ?? false);
  const mentalDone = !!(status?.mentalAssessmentComplete ?? false);
  const domains = status?.completedDomains ?? 0;
  const started = domains > 0 || mentalDone;

  if (submitted) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        Completed
      </span>
    );
  }

  if (!started) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />
        Not Started
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        In Progress
      </span>
      {!physicalDone && (
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
          Physical pending
        </span>
      )}
      {!mentalDone && (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
          Mental pending
        </span>
      )}
    </div>
  );
}

export function screeningStatusLabel(status: any): string {
  if (status?.isComplete) return 'Completed';
  const physicalDone = !!(status?.screeningComplete);
  const mentalDone = !!(status?.mentalAssessmentComplete);
  const domains = status?.completedDomains ?? 0;
  if (physicalDone && mentalDone) return 'Ready to submit';
  if (domains > 0 || mentalDone) return 'In Progress';
  return 'Not Started';
}
