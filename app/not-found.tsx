export default function NotFound() {
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
          Page Not Found
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          The page you are looking for does not exist.
        </p>
      </div>
    </div>
  );
}