import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { AIStudyRoomPage } from './pages/AIStudyRoomPage';
import { PracticePage } from './pages/PracticePage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Central Landing Home Page */}
          <Route index element={<HomePage />} />
          {/* Study Control Center */}
          <Route path="dashboard" element={<DashboardPage />} />
          {/* Knowledge Archive */}
          <Route path="library" element={<LibraryPage />} />
          {/* AI Study Room & Split-Screen Reader */}
          <Route path="study-room" element={<AIStudyRoomPage />} />
          {/* Active Recall Practice / Quiz */}
          <Route path="practice" element={<PracticePage />} />
          <Route path="quiz" element={<PracticePage />} />
          {/* Interactive Flashcards */}
          <Route path="flashcards" element={<FlashcardsPage />} />
          {/* Learning Progress & Analytics */}
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="progress" element={<DashboardPage />} />
          {/* Adaptive Study Planner */}
          <Route path="planner" element={<StudyPlannerPage />} />
          {/* System Settings & Gemini Config */}
          <Route path="settings" element={<SettingsPage />} />
          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
