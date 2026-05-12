'use client'

import type { AutoLogoutState } from '@/hooks/useAutoLogout'

interface Props {
  state: AutoLogoutState
  onContinue: () => void
  onLogout: () => void
  onDismissLoggedOut: () => void
}

export default function AutoLogoutModal({ state, onContinue, onLogout, onDismissLoggedOut }: Props) {
  if (state === 'active') return null

  return (
    <div
      onClick={state === 'loggedOut' ? onDismissLoggedOut : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        cursor: state === 'loggedOut' ? 'pointer' : 'default',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18)',
          maxWidth: '360px',
          width: '100%',
          margin: '0 16px',
          textAlign: 'center',
          fontFamily: 'AtoZ, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {state === 'warning' && (
          <>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏰</div>
            <p
              style={{
                fontSize: '16px',
                color: '#1d1d1f',
                lineHeight: '1.6',
                marginBottom: '28px',
                fontWeight: 500,
              }}
            >
              현재 아무 동작이 없습니다.
              <br />
              <span style={{ color: '#e84c3d', fontWeight: 600 }}>20분 후</span> 자동 로그아웃 됩니다.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={onContinue}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#1d1d1f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                계속 사용하기
              </button>
              <button
                onClick={onLogout}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'transparent',
                  color: '#6e6e73',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f7')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                지금 로그아웃
              </button>
            </div>
          </>
        )}

        {state === 'loggedOut' && (
          <>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>👋</div>
            <p style={{ fontSize: '16px', color: '#1d1d1f', fontWeight: 500, marginBottom: '8px' }}>
              로그아웃 되었습니다.
            </p>
            <p style={{ fontSize: '13px', color: '#6e6e73' }}>화면을 클릭하면 닫힙니다.</p>
          </>
        )}
      </div>
    </div>
  )
}
