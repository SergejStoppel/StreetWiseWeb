
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import AccessibilityServicePage from './pages/AccessibilityServicePage';
import SeoContentServicePage from './pages/SeoContentServicePage';
import WebsiteOverhaulServicePage from './pages/WebsiteOverhaulServicePage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import FreeAuditPage from './pages/FreeAuditPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DetailedReportPage from './pages/DetailedReportPage';
import ResultsPage from './pages/ResultsPage';
import './styles/globals.css';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface-primary);
  font-family: var(--font-family-secondary);
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0;
`;

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContainer>
          <ToastContainer />
          <Router>
          <Header />
          <MainContent>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/accessibility" element={<AccessibilityServicePage />} />
                <Route path="/services/seo-content" element={<SeoContentServicePage />} />
                <Route path="/services/website-overhaul" element={<WebsiteOverhaulServicePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/contact" element={<ContactPage />} />
                
                <Route path="/case-studies" element={<CaseStudiesPage />} />
                <Route path="/free-audit" element={<FreeAuditPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/results/:id" element={<ProtectedRoute><DetailedReportPage /></ProtectedRoute>} />
              </Routes>
          </MainContent>
          <Footer />
        </Router>
        </AppContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
