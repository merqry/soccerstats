import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '0.5rem' 
          }}>
            Soccer Stats Tracker
          </h1>
          <p style={{ color: '#6b7280' }}>
            Track your soccer performance metrics
          </p>
        </div>

        {/* Main Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <Link
            to="/new-game"
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              textAlign: 'center',
              padding: '1rem',
              fontSize: '1.125rem',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Start New Game
          </Link>

          <Link
            to="/history"
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              textAlign: 'center',
              padding: '1rem',
              fontSize: '1.125rem',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            View Game History
          </Link>

          <Link
            to="/players"
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              textAlign: 'center',
              padding: '1rem',
              fontSize: '1.125rem',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Manage Players
          </Link>
        </div>

        {/* Quick Stats */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb', 
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            Quick Stats
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>0</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Games Played</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>0</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Players</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb', 
          padding: '1rem'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            Features
          </h2>
          <ul style={{ color: '#6b7280', fontSize: '0.875rem', paddingLeft: '1.25rem' }}>
            <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#22c55e', marginRight: '0.5rem' }}>✓</span>
              Track multiple metrics per game
            </li>
            <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#22c55e', marginRight: '0.5rem' }}>✓</span>
              Real-time metric calculations
            </li>
            <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#22c55e', marginRight: '0.5rem' }}>✓</span>
              Works offline
            </li>
            <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#22c55e', marginRight: '0.5rem' }}>✓</span>
              Mobile-optimized interface
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};