import { useState, useEffect } from 'react'

interface HealthData {
  status: string
  timestamp: string
  python_version: string
  django_version: string
  database: {
    status: string
    engine: string
  }
  host: string
  scheme: string
}

interface DemoMessage {
  id: number
  text: string
  created_at: string
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [healthError, setHealthError] = useState<string | null>(null)

  const [messages, setMessages] = useState<DemoMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Determine API base URL:
  // Direct domain on port 80 in production, or /api proxy in local development
  const API_BASE = typeof window !== 'undefined' && window.location.hostname.includes('172.27.61.103')
    ? 'http://api.172.27.61.103.sslip.io/api'
    : '/api'

  // Fetch health status
  const fetchHealth = async () => {
    setHealthLoading(true)
    setHealthError(null)
    try {
      const res = await fetch(`${API_BASE}/health/`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const data: HealthData = await res.json()
      setHealth(data)
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setHealthLoading(false)
    }
  }

  // Fetch demo messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.results || [])
      }
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err)
    }
  }

  useEffect(() => {
    fetchHealth()
    fetchMessages()
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage.trim() }),
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages()
      } else {
        const errData = await res.json()
        alert(`Ошибка при отправке: ${JSON.stringify(errData)}`)
      }
    } catch (err) {
      alert(`Ошибка сети: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally {
      setSubmitting(false)
    }
  }



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        border: '1px solid #475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
              ⚡ Coolify Fullstack Starter
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Деплой через 2 Docker-ресурса (Backend + Frontend/Nginx)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={badgeStyle('#3b82f6')}>Python Django</span>
            <span style={badgeStyle('#06b6d4')}>React + TS</span>
            <span style={badgeStyle('#10b981')}>Nginx</span>
            <span style={badgeStyle('#f59e0b')}>HTTP Mode</span>
          </div>
        </div>
      </header>

      {/* Health Check Card */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📡 Статус подключения к Django API</span>
          </h2>
          <button
            onClick={fetchHealth}
            disabled={healthLoading}
            style={buttonStyle}
          >
            {healthLoading ? 'Проверка...' : '🔄 Обновить'}
          </button>
        </div>

        {healthLoading && !health && (
          <p style={{ color: '#94a3b8' }}>Загрузка статуса бэкенда...</p>
        )}

        {healthError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            padding: '1rem',
            borderRadius: '8px',
            color: '#fca5a5'
          }}>
            <strong>Не удалось подключиться к API:</strong> {healthError}
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              Проверьте, что контейнер бэкенда запущен и Nginx корректно проксирует запросы на порт 8000.
            </div>
          </div>
        )}

        {health && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Статус API</span>
              <span style={{ color: health.status === 'healthy' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                ● {health.status.toUpperCase()}
              </span>
            </div>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Схема / Хост</span>
              <span style={{ color: '#f1f5f9', fontWeight: 500 }}>
                {health.scheme}://{health.host}
              </span>
            </div>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Django / Python</span>
              <span style={{ color: '#f1f5f9', fontWeight: 500 }}>
                v{health.django_version} / {health.python_version}
              </span>
            </div>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>База данных</span>
              <span style={{ color: '#4ade80', fontWeight: 500 }}>
                {health.database.engine} ({health.database.status})
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Interactive API Demo Card */}
      <section style={cardStyle}>
        <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '1rem' }}>
          💬 Интерактивный тест API (GET / POST)
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Проверка отправки данных и работы CORS/CSRF при HTTP-протоколе:
        </p>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Введите тестовое сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #475569',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '0.95rem'
            }}
          />
          <button
            type="submit"
            disabled={submitting || !newMessage.trim()}
            style={{ ...buttonStyle, background: '#3b82f6', borderColor: '#2563eb' }}
          >
            {submitting ? 'Отправка...' : 'Отправить'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: '0.75rem 1rem',
                background: '#0f172a',
                borderRadius: '8px',
                border: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#e2e8f0' }}>{msg.text}</span>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Deployment Info Card */}
      <section style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: '0.5rem' }}>
          ℹ️ Информация о конфигурации Coolify
        </h3>
        <ul style={{ color: '#94a3b8', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
          <li><strong>Адрес сервера:</strong> <code>http://172.27.61.103.sslip.io</code> (протокол HTTP)</li>
          <li><strong>Ресурс 1 (Backend):</strong> Порт 8000, Gunicorn, Django REST Framework, WhiteNoise</li>
          <li><strong>Ресурс 2 (Frontend):</strong> Порт 80, Vite React TS, Nginx Alpine Reverse Proxy</li>
          <li><strong>CI/CD:</strong> GitHub Actions с вызовом Coolify Webhooks при коммитах в main</li>
        </ul>
      </section>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#1e293b',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #334155',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
}

const buttonStyle: React.CSSProperties = {
  background: '#334155',
  color: '#f8fafc',
  border: '1px solid #475569',
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
}

const statBoxStyle: React.CSSProperties = {
  background: '#0f172a',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid #334155',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
}

const statLabelStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const badgeStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: '#ffffff',
  padding: '0.25rem 0.6rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 600,
})
