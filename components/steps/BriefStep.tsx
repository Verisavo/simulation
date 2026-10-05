'use client';

import { useState } from 'react';
import { EXAMPLE_QUESTIONS, parseBrief, type Brief } from '@/lib/brief';
import { NavRow } from '../ui';

export default function BriefStep({
  brief,
  setBrief,
  log,
  notify,
  onNext,
}: {
  brief: Brief;
  setBrief: (b: Brief) => void;
  log: (text: string) => void;
  notify: (msg: string) => void;
  onNext: () => void;
}) {
  const [question, setQuestion] = useState(brief.question);
  const [exampleIndex, setExampleIndex] = useState(0);

  const draft = (q: string) => {
    const next = parseBrief(q, brief);
    setBrief(next);
    log(`Brief drafted: raise ${next.price}% or hold, ${next.city}, ${next.horizon} months.`);
    notify('Brief updated');
  };

  const field = <K extends keyof Brief>(key: K, value: Brief[K]) => setBrief({ ...brief, [key]: value });
  const logField = (label: string, value: string | number) => log(`Brief changed: ${label} set to ${value}.`);

  return (
    <>
      <section className="card" aria-labelledby="qh">
        <h2 id="qh">What are you deciding?</h2>
        <p className="intro muted">Describe the decision as you would to a colleague.</p>
        <label className="sr" htmlFor="q">
          Your question
        </label>
        <textarea
          id="q"
          className="field"
          rows={3}
          style={{ marginTop: 14 }}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          <button type="button" className="btn" onClick={() => draft(question)}>
            Draft brief
          </button>
          <button
            type="button"
            className="btn2"
            onClick={() => {
              const q = EXAMPLE_QUESTIONS[exampleIndex % EXAMPLE_QUESTIONS.length];
              setExampleIndex((i) => i + 1);
              setQuestion(q);
              draft(q);
            }}
          >
            Try another example
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Brief</h2>
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="tile">
            <div className="lbl">Option A</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>Raise list price {brief.price}%</div>
          </div>
          <div className="tile">
            <div className="lbl">Option B</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>Hold price, absorb input costs</div>
          </div>
        </div>
        <div className="grid3" style={{ marginTop: 16 }}>
          <div className="fl">
            <label className="lbl" htmlFor="f-price">
              Price increase (%)
            </label>
            <input
              id="f-price"
              className="field mono"
              type="number"
              min={1}
              max={30}
              step={1}
              value={brief.price}
              onChange={(e) => field('price', Math.max(1, Math.min(30, parseInt(e.target.value || '1', 10))))}
              onBlur={() => logField('price increase', `${brief.price}%`)}
            />
          </div>
          <div className="fl">
            <label className="lbl" htmlFor="f-city">
              City
            </label>
            <input
              id="f-city"
              className="field"
              value={brief.city}
              onChange={(e) => field('city', e.target.value)}
              onBlur={() => logField('city', brief.city)}
            />
          </div>
          <div className="fl">
            <label className="lbl" htmlFor="f-h">
              Horizon (months)
            </label>
            <input
              id="f-h"
              className="field mono"
              type="number"
              min={1}
              max={24}
              value={brief.horizon}
              onChange={(e) => field('horizon', Math.max(1, Math.min(24, parseInt(e.target.value || '1', 10))))}
              onBlur={() => logField('horizon', `${brief.horizon} months`)}
            />
          </div>
        </div>
        <div className="fl" style={{ marginTop: 14 }}>
          <label className="lbl" htmlFor="f-ch">
            Channel
          </label>
          <input
            id="f-ch"
            className="field"
            value={brief.channel}
            onChange={(e) => field('channel', e.target.value)}
            onBlur={() => logField('channel', brief.channel)}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="lbl">Outcomes measured</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <span className="chip">Volume</span>
            <span className="chip">Gross profit</span>
          </div>
        </div>
      </section>

      <div className="banner info">
        <span>
          This simulation explores a range of outcomes under assumptions you can see and change. It does not predict a
          single result or make the decision.
        </span>
      </div>

      <NavRow next="Assemble evidence" onNext={onNext} />
    </>
  );
}
