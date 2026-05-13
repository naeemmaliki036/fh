interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 6 }: TableSkeletonProps): React.ReactElement {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-3 py-3">
              <div className="h-4 rounded bg-muted animate-pulse" style={{ width: colIdx === 0 ? "70%" : "55%" }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
