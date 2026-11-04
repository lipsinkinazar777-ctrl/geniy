import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';

export default function NotFound() {
  return (
    <div className="page" style={{ minHeight: '70svh' }}>
      <PageHead kicker="404" title="This page does not exist">The link may be old or mistyped.</PageHead>
      <div className="center"><Link className="btn btn--pill btn--fill btn--lg" to="/">Go to the home page <span className="arrow" /></Link></div>
    </div>
  );
}
