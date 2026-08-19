interface AdminPageLoaderProps {
  fullScreen?: boolean;
}

export default function AdminPageLoader({
  fullScreen = false,
}: AdminPageLoaderProps) {
  return (
    <div
      className={`page-loading${fullScreen ? " page-loading--screen" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="loading-spinner" />
      <span>Loading...</span>
    </div>
  );
}
