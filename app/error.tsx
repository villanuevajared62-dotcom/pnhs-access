"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: '#f9fafb'
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        textAlign: 'center',
        maxWidth: '520px'
      }}>
        <h2 style={{ color: '#111827', fontSize: '20px', marginBottom: '12px' }}>
          Something went wrong
        </h2>
        {error?.digest && (
          <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
            Error digest: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            background: '#10b981',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}