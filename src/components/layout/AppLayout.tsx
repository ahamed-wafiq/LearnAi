import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Dashboard Overview',
          subtitle: 'Track your daily study streaks, mastery heatmap, and upcoming active recalls.'
        };
      case '/library':
        return {
          title: 'Knowledge Library',
          subtitle: 'Manage research papers, lecture notes, and automated concept syntheses.'
        };
      case '/study-room':
        return {
          title: 'AI Study Room',
          subtitle: 'Interactive side-by-side reading, formula analysis, and contextual citations.'
        };
      case '/practice':
        return {
          title: 'Adaptive Practice & Quizzes',
          subtitle: 'Active recall drills generated automatically with citation references.'
        };
      case '/flashcards':
        return {
          title: 'Interactive Flashcards',
          subtitle: 'Spaced repetition system (SRS) powered by the Leitner recall algorithm.'
        };
      case '/analytics':
        return {
          title: 'Performance & Mastery Analytics',
          subtitle: 'Detailed skill breakdown, retention decay curves, and topic heatmaps.'
        };
      case '/planner':
        return {
          title: 'Intelligent Study Planner',
          subtitle: 'Automated revision schedules, exam milestones, and active recall slots.'
        };
      default:
        return {
          title: 'LearnSphere',
          subtitle: 'AI-Powered Personalized Study Platform'
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans selection:bg-primary-500/30 selection:text-primary-200">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-primary-900/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-blue/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-accent-cyan/5 blur-[100px]" />
      </div>

      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main workspace */}
      <div className="lg:pl-64 flex flex-col min-h-screen relative z-10">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={meta.title}
          subtitle={meta.subtitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
