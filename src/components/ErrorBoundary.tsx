import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: any) {
    // optionally log to a monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="max-w-xl text-center">
            <h2 className="text-2xl font-bold mb-3">Terjadi kesalahan</h2>
            <p className="mb-4 text-slate-300">Aplikasi mengalami error saat memuat. Coba refresh halaman atau periksa koneksi.</p>
            <details className="text-left text-xs text-slate-400 bg-slate-800/40 p-3 rounded">
              <summary className="cursor-pointer">Tampilkan detail error</summary>
              <pre className="whitespace-pre-wrap break-words mt-2 text-xs">{String(this.state.error)}</pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
