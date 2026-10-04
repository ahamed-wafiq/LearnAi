import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
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
          <Route index element={<DashboardPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="study-room" element={<AIStudyRoomPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="planner" element={<StudyPlannerPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
