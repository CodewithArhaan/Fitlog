"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import "./intro-enhancements.css";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Dumbbell, History,
} from "lucide-react";

type HomeIntroductionProps = { onOpenLog?: () => void };

function IntroAction({ className, children, onOpenLog }: HomeIntroductionProps & { className: string; children: ReactNode }) {
  if (onOpenLog) return <button className={className} type="button" onClick={onOpenLog}>{children}</button>;
  return <Link className={className} href="/#workout">{children}</Link>;
}

export default function HomeIntroduction({ onOpenLog }: HomeIntroductionProps) {
  return <main className="intro-page">
    <header className="intro-header">
      <Link className="intro-brand" href="/" aria-label="FitLog home">
        <span className="intro-brand-mark"><Activity size={18} /></span>
        <span>fit<span>log</span></span>
      </Link>
      <nav className="intro-nav" aria-label="Introduction navigation">
        <a href="#approach">The approach</a>
        <IntroAction className="intro-nav-cta cursor-pointer" onOpenLog={onOpenLog}>Open your log <ArrowUpRight size={15} /></IntroAction>
      </nav>
    </header>

    <section className="intro-hero" aria-labelledby="intro-title">
      <div className="intro-hero-image" role="img" aria-label="Strength training equipment in a bright, modern gym" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2400&q=85')" }} />
      <div className="intro-hero-content">
        <span className="intro-eyebrow"><i /> TRAINING, TRACKED</span>
        <h1 id="intro-title">A little stronger.<br /><span>Every session.</span></h1>
        <p>A calm, clear place for the work you put in. Log your lifts, return to routines, and see consistency take shape.</p>
        <IntroAction className="intro-primary-cta cursor-pointer" onOpenLog={onOpenLog}>Open your training log <ArrowRight size={17} /></IntroAction>
      </div>
      <div className="intro-hero-caption"><span>YOUR TRAINING, IN ONE PLACE</span><span>01 / 03</span></div>
    </section>

    <section className="intro-approach" id="approach" aria-labelledby="approach-title">
      <div className="intro-section-heading">
        <span className="intro-section-kicker">MADE FOR THE LONG GAME</span>
        <h2 id="approach-title">Keep your focus<br /><span>on the next rep.</span></h2>
      </div>
      <div className="intro-feature-list">
        <article className="intro-feature cursor-pointer">
          <span className="intro-feature-index">01</span>
          <Dumbbell size={20} aria-hidden="true" />
          <h3>Log the work</h3>
          <p>Capture exercises, sets, reps, and weight while your session is fresh.</p>
        </article>
        <article className="intro-feature cursor-pointer">
          <span className="intro-feature-index">02</span>
          <CalendarDays size={20} aria-hidden="true" />
          <h3>Keep your rhythm</h3>
          <p>Save routines you want to return to and build a steady weekly habit.</p>
        </article>
        <article className="intro-feature cursor-pointer">
          <span className="intro-feature-index">03</span>
          <BarChart3 size={20} aria-hidden="true" />
          <h3>See it add up</h3>
          <p>Find every session in your history and follow your progress over time.</p>
        </article>
      </div>
    </section>

    <section className="intro-finish">
      <div><span className="intro-section-kicker">START WHERE YOU ARE</span><h2>One session at a time.</h2></div>
      <IntroAction className="intro-primary-cta cursor-pointer" onOpenLog={onOpenLog}>Go to FitLog <ArrowRight size={17} /></IntroAction>
    </section>

    <footer className="intro-footer">
      <Link className="intro-brand" href="/" aria-label="FitLog home"><span className="intro-brand-mark"><Activity size={16} /></span><span>fit<span>log</span></span></Link>
      <span>Small lifts. Stronger days.</span>
      <IntroAction className="intro-footer-link" onOpenLog={onOpenLog}>Your training log <History size={14} /></IntroAction>
    </footer>
  </main>;
}
