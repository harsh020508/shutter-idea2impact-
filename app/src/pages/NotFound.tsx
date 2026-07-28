import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfaf9] dark:bg-[#121212] px-4">
      <div className="w-full max-w-md text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-8 sm:p-10">
        {/* Compass icon */}
        <div className="flex justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-400 dark:text-neutral-500"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
              fill="currentColor"
              opacity="0.15"
            />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>

        {/* 404 heading */}
        <h1 className="text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
          404
        </h1>

        <p className="mt-3 text-lg font-medium text-neutral-700 dark:text-neutral-300">
          Page not found
        </p>

        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200"
          >
            Go Home
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-700 dark:text-neutral-300 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Dashboard
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-xl bg-transparent text-neutral-500 dark:text-neutral-400 px-5 py-2.5 text-sm font-medium transition-colors hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
