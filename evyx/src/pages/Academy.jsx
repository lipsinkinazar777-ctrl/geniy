import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Modal from '../components/Modal.jsx';
import Accordion from '../components/Accordion.jsx';
import { freeCourses, program, academyFaq } from '../data/academy.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { load, save } from '../lib/storage.js';
import { useReveal } from '../hooks/useReveal.js';

const KEY = 'evyx-academy';

/* Enrolment and lesson progress for the free courses, kept in this browser. */
function useProgress() {
  const [state, setState] = useState(() => load(KEY, {}));
  useEffect(() => { save(KEY, state); }, [state]);
  const enroll = id => setState(s => ({ ...s, [id]: s[id] || [] }));
  const toggle = (id, i) => setState(s => {
    const done = s[id] || [];
    return { ...s, [id]: done.includes(i) ? done.filter(x => x !== i) : [...done, i] };
  });
  return { state, enroll, toggle };
}

export default function Academy() {
  const root = useRef(null);
  const [courseId, setCourseId] = useState(null);
  const [moduleIndex, setModuleIndex] = useState(null);
  const [lesson, setLesson] = useState(0);
  const { state, enroll, toggle } = useProgress();
  const { addCourse, hasCourse } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  useReveal(root);

  const course = freeCourses.find(c => c.id === courseId);
  const openCourse = id => { setCourseId(id); setLesson(0); };
  const enrollProgram = () => {
    if (!hasCourse) { addCourse(); toast('The EVYX Program is in your cart'); }
    navigate('/checkout');
  };
  const enrollFree = c => { enroll(c.id); toast(`Enrolled in ${c.title}`); };

  return (
    <div className="page" ref={root}>
      <PageHead kicker="EVYX Academy" title="How to make AI video free">
        Start with the free courses: pick a video type, follow four lessons, use free tools only. When you want the full system, enrol in the program.
      </PageHead>

      <section className="container">
        <div className="head" data-reveal><div><span className="kicker">Free courses</span><h2 className="h2">Four lessons each. No card needed.</h2></div></div>
        <div className="courses">
          {freeCourses.map(c => {
            const done = state[c.id];
            const pct = done ? Math.round((done.length / c.lessons.length) * 100) : 0;
            return (
              <article key={c.id} className="glass course" data-reveal>
                <div className="course__cover"><img src={c.cover} alt="" loading="lazy" /><span className="course__tag">{c.tag}</span></div>
                <div className="course__body">
                  <h3 className="h3">{c.title}</h3>
                  <p className="small">{c.lessons.length} lessons · {c.minutes} min · Free</p>
                  {done
                    ? <div className="progress" aria-label={`${pct}% complete`}><i style={{ width: `${pct}%` }} /><span>{pct}% complete</span></div>
                    : <p className="course__hint">Enrol to track your progress.</p>}
                  <div className="course__btns">
                    {done
                      ? <button type="button" className="btn btn--pill btn--fill" onClick={() => openCourse(c.id)}>{pct === 100 ? 'Review lessons' : 'Continue'}</button>
                      : <button type="button" className="btn btn--pill btn--fill" onClick={() => { enrollFree(c); openCourse(c.id); }}>Enrol free</button>}
                    <button type="button" className="tlink" onClick={() => openCourse(c.id)}>Preview lessons</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sec" id="program">
        <div className="container">
          <div className="glass product" data-reveal>
            <div className="product__l">
              <span className="kicker">Flagship course</span>
              <div className="num gtext">${program.price}</div>
              <h3 className="h3">{program.title}</h3>
              <p className="small" style={{ margin: '10px 0 26px', maxWidth: '32ch' }}>{program.edition} No subscriptions, no tiers.</p>
              <button type="button" className="btn btn--pill btn--fill btn--lg" onClick={enrollProgram}>{hasCourse ? 'In cart · Go to checkout' : `Enrol · $${program.price}`} <span className="arrow" /></button>
            </div>
            <div><ul className="ticks">{program.includes.map(i => <li key={i}>{i}</li>)}</ul></div>
          </div>

          <div className="head" style={{ marginTop: 'clamp(64px,8vw,110px)' }} data-reveal><div><span className="kicker">Curriculum</span><h2 className="h2">Six modules, eighteen lessons</h2></div></div>
          <div className="modules">
            {program.modules.map((m, i) => (
              <div key={m.title} className="module" data-reveal>
                <span className="module__n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="h3">{m.title}</h3>
                  <p>{m.text}</p>
                  <ul className="lessons">
                    {m.lessons.map((l, j) => (
                      <li key={l} className={j === 0 ? 'is-open' : 'is-locked'}><span>{l}</span><small>{j === 0 ? 'Free preview' : 'In the program'}</small></li>
                    ))}
                  </ul>
                  <button type="button" className="tlink" onClick={() => setModuleIndex(i)}>Preview lesson 1 <span className="arrow" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec--line"><div className="container"><h2 className="h2 center" style={{ marginBottom: 48 }} data-reveal>Questions</h2><div data-reveal><Accordion items={academyFaq} /></div></div></section>

      <Modal open={!!course} onClose={() => setCourseId(null)} wide label={course ? course.title : 'Course'}>
        {course && (
          <div className="player-course">
            <div>
              <span className="kicker">{course.tag} · free course</span>
              <h3 className="h2 preview__title">{course.title}</h3>
              <ol className="lesson-nav">
                {course.lessons.map(([t], i) => {
                  const isDone = (state[course.id] || []).includes(i);
                  return (
                    <li key={t}>
                      <button type="button" aria-current={lesson === i} onClick={() => setLesson(i)}>
                        <span className={`dot${isDone ? ' dot--done' : ''}`} aria-hidden="true" />{t}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="lesson">
              <span className="small">Lesson {lesson + 1} of {course.lessons.length}</span>
              <h4 className="h3">{course.lessons[lesson][0]}</h4>
              <p>{course.lessons[lesson][1]}</p>
              <div className="lesson__btns">
                {state[course.id]
                  ? <label className="check"><input type="checkbox" checked={(state[course.id] || []).includes(lesson)} onChange={() => toggle(course.id, lesson)} /> Mark as done</label>
                  : <button type="button" className="btn btn--sm" onClick={() => enrollFree(course)}>Enrol to track progress</button>}
                <div className="lesson__pager">
                  <button type="button" className="btn btn--sm" disabled={lesson === 0} onClick={() => setLesson(l => l - 1)}>Back</button>
                  {lesson < course.lessons.length - 1
                    ? <button type="button" className="btn btn--sm btn--fill" onClick={() => setLesson(l => l + 1)}>Next lesson</button>
                    : <button type="button" className="btn btn--sm btn--fill" onClick={() => { setCourseId(null); document.getElementById('program').scrollIntoView({ behavior: 'smooth' }); }}>See the full program</button>}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={moduleIndex !== null} onClose={() => setModuleIndex(null)} label="Lesson preview">
        {moduleIndex !== null && (
          <div>
            <span className="kicker">Module {moduleIndex + 1} · free preview</span>
            <h3 className="h2 preview__title">{program.modules[moduleIndex].lessons[0]}</h3>
            <p style={{ color: 'var(--ink-2)', marginBottom: 18 }}>{program.modules[moduleIndex].text}</p>
            <ul className="lessons">{program.modules[moduleIndex].lessons.slice(1).map(l => <li key={l} className="is-locked"><span>{l}</span><small>In the program</small></li>)}</ul>
            <div className="preview__btns">
              <button type="button" className="btn btn--pill btn--fill btn--lg" onClick={() => { setModuleIndex(null); enrollProgram(); }}>Enrol · ${program.price} <span className="arrow" /></button>
              <button type="button" className="tlink" onClick={() => setModuleIndex(null)}>Keep browsing</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
