function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="page auth-page">
      <div className="card">
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        {children}
      </div>
    </main>
  );
}

export default AuthLayout;
