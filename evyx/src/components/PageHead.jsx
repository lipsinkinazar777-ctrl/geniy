export default function PageHead({ kicker, title, children }) {
  return (
    <div className="container page__head" data-reveal>
      <span className="kicker">{kicker}</span>
      <h1 className="h1">{title}</h1>
      {children && <p className="lede">{children}</p>}
    </div>
  );
}
