# Browser routing

The application uses React Router `BrowserRouter` and is served from the domain
root. URLs use paths such as `/login`, `/reader/book-detail`, and
`/staff/materials`. Old `#/...` bookmarks must be updated to these paths.

Vite development and preview servers provide SPA fallback. In production, the
host must serve existing static files normally and return `index.html` for
application routes. Otherwise, opening or refreshing a nested URL returns 404.

For Nginx, configure the location serving the built `dist` directory:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

If the same host provides an API, configure its location separately so API
requests do not fall back to `index.html`. Other hosting platforms need an
equivalent SPA rewrite rule; no production host has been configured here.

Before release, test direct navigation and refresh at `/reader/book-detail`,
`/reader/document/12`, `/staff/materials/new`, and `/admin/profile`. Also check
Back/Forward, logout, notification actions, and navigation on mobile. Login
remains a prototype; open role URLs directly when checking those screens.
