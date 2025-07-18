import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import EnhancedResultsPage from './pages/EnhancedResultsPage';
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
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
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

// Placeholder components for pages not yet implemented
const PlaceholderPage = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-4xl);
  text-align: center;
`;

const PlaceholderTitle = styled.h1`
  font-size: var(--font-size-5xl);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-bold);
`;

const PlaceholderText = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 600px;
  line-height: var(--line-height-relaxed);
`;



const ComingSoonPage = ({ title, description }) => (
  <PlaceholderPage>
    <PlaceholderTitle>{title}</PlaceholderTitle>
    <PlaceholderText>{description}</PlaceholderText>
  </PlaceholderPage>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContainer>
            <Header />
            <MainContent>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/accessibility" element={<AccessibilityServicePage />} />
                <Route path="/services/seo-content" element={<SeoContentServicePage />} />
                <Route path="/services/website-overhaul" element={<WebsiteOverhaulServicePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/free-audit" element={<FreeAuditPage />} />
                <Route path="/case-studies" element={<CaseStudiesPage />} />
                
                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Results Routes - Support both sessionStorage (anonymous) and database (authenticated) */}
                <Route path="/results" element={<EnhancedResultsPage />} />
                <Route path="/results/:analysisId" element={<EnhancedResultsPage />} />
                
                {/* Protected Routes */}
                <Route path="/results-old" element={
                  <ProtectedRoute>
                    <ResultsPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Legacy login route redirect */}
                <Route path="/login-old" element={<LoginPage />} />
                
                {/* 404 Page */}
                <Route path="*" element={
                  <ComingSoonPage 
                    title="Page Not Found" 
                    description="The page you're looking for doesn't exist or hasn't been implemented yet." 
                  />
                } />
              </Routes>
            </MainContent>
            <Footer />
            <ToastContainer 
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </AppContainer>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;