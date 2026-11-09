import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { clearAuthSession, getAccessToken, restoreAuthSession } from './services/session'
import { tryRefreshAccessToken } from './services/http'
import { authSession } from './shared/auth/auth-session'

restoreAuthSession()
const restoration = getAccessToken() && !authSession.getSnapshot().session
  ? tryRefreshAccessToken().then((token) => {
      if (!token && !authSession.getSnapshot().session && getAccessToken()) clearAuthSession("expired")
    })
  : undefined
window.addEventListener("storage", (event) => {
  if (event.key === null || event.key === "ptit-library-session") restoreAuthSession()
})
authSession.onAuthError((status) => {
  if (status === 401) clearAuthSession("expired")
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App restoration={restoration} />
    </BrowserRouter>
  </React.StrictMode>,
)
