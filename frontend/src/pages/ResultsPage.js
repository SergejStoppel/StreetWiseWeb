import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaImage,
  FaWpforms,
  FaLink,
  FaPalette,
  FaCrown,
  FaLock,
  FaStar,
  FaLanguage,
  FaFileAlt,
  FaArrowRight
} from 'react-icons/fa';
import ScoreCard from '../components/ScoreCard';
import ViolationsList from '../components/ViolationsList';
import RecommendationsList from '../components/RecommendationsList';
import NavigationResults from '../components/NavigationResults';
import TouchTargetResults from '../components/TouchTargetResults';
import KeyboardShortcutResults from '../components/KeyboardShortcutResults';
import ContentStructureResults from '../components/ContentStructureResults';
import MobileAccessibilityResults from '../components/MobileAccessibilityResults';
import LoadingSpinner from '../components/LoadingSpinner';
import { accessibilityAPI } from '../services/api';
import IssueTable from '../components/reports/DetailedReport/IssueTable/IssueTable';
import { AccessibilityIssue } from '../models/AccessibilityIssue';

const ResultsContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-md);
  background: var(--color-surface-primary);
  min-height: 100vh;
  
  @media (min-width: 768px) {
    padding: var(--spacing-2xl);
  }
  
  @media (max-width: 768px) {
    padding: var(--spacing-lg) var(--spacing-sm);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-primary);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding-bottom: var(--spacing-md);
  }
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const BackButton = styled.button`
  background: var(--color-interactive-secondary);
  color: var(--color-text-on-brand);
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  
  &:hover {
    background: var(--color-interactive-secondary-hover);
    transform: translateY(-1px);
  }
`;

const DownloadButton = styled.button`
  background: ${props => props.premium ? 
    'linear-gradient(135deg, var(--color-warning) 0%, var(--color-warning-hover) 100%)' :
    'var(--color-interactive-primary)'};
  color: var(--color-text-on-brand);
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  position: relative;
  
  &:hover {
    background: ${props => props.premium ? 
      'linear-gradient(135deg, var(--color-warning-hover) 0%, var(--color-warning) 100%)' :
      'var(--color-interactive-primary-hover)'};
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }
  
  &:disabled {
    background: var(--color-text-tertiary);
    cursor: not-allowed;
    transform: none;
  }
`;

const UpgradeButton = styled.button`
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  color: var(--color-text-on-brand);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-lg);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
  
  &:disabled {
    background: var(--color-text-tertiary);
    cursor: not-allowed;
    transform: none;
  }
`;

const Title = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-align: left;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-2xl);
    text-align: center;
  }
`;

const ReportTypeBadge = styled.span`
  background: ${props => props.type === 'detailed' ? 
    'linear-gradient(135deg, var(--color-warning) 0%, var(--color-warning-hover) 100%)' :
    'var(--color-surface-secondary)'};
  color: ${props => props.type === 'detailed' ? 
    'var(--color-text-on-brand)' : 
    'var(--color-text-primary)'};
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  border: 1px solid var(--color-border-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

const Subtitle = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-xs);
  text-align: left;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    text-align: center;
    font-size: var(--font-size-sm);
  }
`;

const AnalysisInfo = styled.div`
  display: flex;
  gap: var(--spacing-md);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  text-align: left;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--spacing-xs);
    text-align: center;
  }
`;



const LockedSection = styled.div`
  background: var(--color-surface-secondary);
  border: 2px dashed var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-3xl) var(--spacing-2xl);
  text-align: center;
  margin: var(--spacing-2xl) 0;
`;

const LockIcon = styled.div`
  font-size: var(--font-size-5xl);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
`;

const LockedTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
`;

const LockedDescription = styled.p`
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-lg);
`;

const ExcellentAccessibilitySection = styled.div`
  background: var(--color-success-light);
  border: 2px solid var(--color-success);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  text-align: center;
  margin: var(--spacing-md) 0;
`;

const ExcellentIcon = styled.div`
  font-size: var(--font-size-5xl);
  color: var(--color-success);
  margin-bottom: var(--spacing-md);
  display: flex;
  justify-content: center;
`;

const ExcellentTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  color: var(--color-success-text);
  margin-bottom: var(--spacing-md);
  text-align: center;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xl);
  }
`;

const ExcellentDescription = styled.p`
  color: var(--color-success-text);
  font-size: var(--font-size-lg);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
  text-align: center;
  
  &:last-child {
    margin-bottom: 0;
    font-weight: var(--font-weight-semibold);
  }
  
  @media (max-width: 768px) {
    font-size: var(--font-size-base);
  }
`;

const ScoresSection = styled.section`
  margin-bottom: var(--spacing-3xl);
`;

const ScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
`;


const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }
`;

const SummaryCard = styled.div`
  text-align: center;
  padding: var(--spacing-md);
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
`;

const SummaryIcon = styled.div`
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-xs);
  color: ${props => props.color || 'var(--color-text-tertiary)'};
`;

const SummaryValue = styled.div`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  text-align: center;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xl);
  }
`;

const SummaryLabel = styled.div`
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  text-align: center;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xs);
  }
`;

const Section = styled.section`
  margin-bottom: var(--spacing-3xl);
  padding: var(--spacing-lg) 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border-secondary);
  }
  
  @media (max-width: 768px) {
    margin-bottom: var(--spacing-2xl);
    padding: var(--spacing-md) 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  text-align: left;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    text-align: center;
    font-size: var(--font-size-xl);
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-2xl);
  color: var(--color-text-secondary);
`;

const NoResultsTitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  text-align: center;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xl);
  }
`;

const NoResultsText = styled.p`
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-2xl);
  text-align: center;
  line-height: 1.5;
  color: var(--color-text-secondary);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

// Overview Report Components
const CriticalIssuesSection = styled.section`
  margin-bottom: var(--spacing-3xl);
`;

const CriticalIssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const CriticalIssueCard = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  transition: var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const IssueHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
`;

const IssueIcon = styled.div`
  font-size: var(--font-size-2xl);
  color: ${props => props.color};
  flex-shrink: 0;
  margin-top: var(--spacing-xs);
`;

const IssueInfo = styled.div`
  flex: 1;
`;

const IssueTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  text-align: left;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-lg);
  }
`;

const IssueCount = styled.p`
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  margin: 0;
  text-align: left;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xs);
  }
`;

// Enhanced Issue Display Components
const IssueMetadata = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xs);
  flex-wrap: wrap;
`;

const DisabilityImpactBadges = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
`;

const DisabilityBadge = styled.span`
  background: var(--color-info-light);
  color: var(--color-info-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  border: 1px solid var(--color-info);
`;

const WcagBadge = styled.span`
  background: var(--color-warning-light);
  color: var(--color-warning-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  border: 1px solid var(--color-warning);
`;

const ElementCount = styled.span`
  background: var(--color-error-light);
  color: var(--color-error-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  border: 1px solid var(--color-error);
`;

const FixIssuesButton = styled.button`
  background: var(--color-success);
  color: var(--color-text-on-brand);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    background: var(--color-success-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ImpactBadge = styled.span`
  background: ${props => props.severity === 'critical' ? 'var(--color-error-light)' : 'var(--color-warning-light)'};
  color: ${props => props.severity === 'critical' ? 'var(--color-error)' : 'var(--color-warning)'};
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
`;

const IssueDescription = styled.p`
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
  text-align: left;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

const FixGuidance = styled.div`
  background: var(--color-success-light);
  border: 1px solid var(--color-border-success);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
`;

const FixTitle = styled.h4`
  color: var(--color-success-text);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  text-align: left;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

const FixSteps = styled.ol`
  margin: 0 0 var(--spacing-md) 0;
  padding-left: var(--spacing-lg);
  color: var(--color-success-text);
  font-family: var(--font-family-secondary);
  text-align: left;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

const FixStep = styled.li`
  margin-bottom: var(--spacing-xs);
  line-height: 1.6;
  text-align: left;
`;

const FixTime = styled.p`
  color: var(--color-success-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-secondary);
  margin: 0;
  text-align: left;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xs);
  }
`;

const QuickWinsSection = styled.section`
  margin-bottom: var(--spacing-3xl);
`;

const QuickWinsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
`;

const QuickWinCard = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  text-align: center;
  transition: var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const QuickWinIcon = styled.div`
  font-size: var(--font-size-3xl);
  color: ${props => props.color};
  margin-bottom: var(--spacing-md);
`;

const QuickWinTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  text-align: center;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-base);
  }
`;

const QuickWinDescription = styled.p`
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

const QuickWinTime = styled.p`
  color: var(--color-success);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-secondary);
  margin: 0;
  text-align: center;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xs);
  }
`;

// Pricing Section Components
const PricingSection = styled.section`
  margin: var(--spacing-3xl) 0;
  padding: var(--spacing-2xl);
  background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-surface-tertiary) 100%);
  border-radius: var(--border-radius-xl);
  border: 1px solid var(--color-border-primary);
`;

const PricingTitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  text-align: center;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-2xl);
  }
`;

const PricingDescription = styled.p`
  font-size: var(--font-size-base);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-2xl);
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
`;

const PricingCard = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  border: ${props => props.featured ? '3px solid var(--color-interactive-primary)' : '1px solid var(--color-border-primary)'};
  position: relative;
  transition: var(--transition-fast);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }
`;

const PricingCardHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  position: relative;
`;

const PricingCardTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  text-align: center;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-lg);
  }
`;

const PricingCardPrice = styled.div`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  color: var(--color-interactive-primary);
  margin-bottom: var(--spacing-xs);
  text-align: center;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

const PricingCardBadge = styled.span`
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  position: absolute;
  top: calc(-1 * var(--spacing-xs));
  right: calc(-1 * var(--spacing-xs));
`;

const PricingCardFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-2xl) 0;
`;

const PricingFeature = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
  text-align: left;
  line-height: 1.4;
  
  svg {
    color: var(--color-success);
    flex-shrink: 0;
  }
`;

const PricingCardButton = styled.button`
  width: 100%;
  background: ${props => props.featured ? 
    'linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%)' :
    'var(--color-interactive-primary)'};
  color: var(--color-text-on-brand);
  padding: var(--spacing-lg) var(--spacing-2xl);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  box-shadow: var(--shadow-md);
  min-height: 56px;
  
  &:hover:not(:disabled) {
    background: ${props => props.featured ? 
      'linear-gradient(135deg, var(--color-interactive-primary-hover) 0%, var(--color-interactive-primary-active) 100%)' :
      'var(--color-interactive-primary-hover)'};
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &:disabled {
    background: var(--color-text-tertiary);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Color Contrast Analysis Components
const ColorContrastOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ContrastCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ContrastValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color || '#374151'};
  margin-bottom: 0.5rem;
`;

const ContrastLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const ContrastDescription = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
`;


// Helper functions for overview report
const getCriticalIssues = (results) => {
  const issues = [];
  
  // Image accessibility issues
  if (results.summary.imagesWithoutAlt > 0) {
    issues.push({
      title: "Images Missing Alt Text",
      count: results.summary.imagesWithoutAlt,
      severity: "critical",
      impact: "High Impact",
      icon: <FaImage />,
      description: "Images without alternative text are invisible to screen readers, making your content inaccessible to users with visual impairments.",
      disabilityGroups: ["Blind", "Low Vision", "+1 more"],
      wcagCriteria: "Level A",
      fixSteps: [
        "Add descriptive alt text to all images",
        "Use empty alt=\"\" for decorative images",
        "Ensure alt text describes the image's purpose, not just its appearance"
      ],
      estimatedTime: "30-60 minutes"
    });
  }
  
  // Form accessibility issues
  if (results.summary.formsWithoutLabels > 0) {
    issues.push({
      title: "Form Fields Without Labels",
      count: results.summary.formsWithoutLabels,
      severity: "critical",
      impact: "High Impact",
      icon: <FaWpforms />,
      description: "Form fields without proper labels make it impossible for screen reader users to understand what information is required.",
      disabilityGroups: ["Blind", "Cognitive", "+2 more"],
      wcagCriteria: "Level A",
      fixSteps: [
        "Add <label> elements for all form inputs",
        "Use aria-label for inputs where visual labels aren't possible",
        "Ensure labels are properly associated with their inputs"
      ],
      estimatedTime: "15-30 minutes"
    });
  }
  
  // Color contrast issues
  if (results.summary.colorContrastViolations > 0) {
    issues.push({
      title: "Color Contrast Issues",
      count: results.summary.colorContrastViolations,
      severity: "serious",
      impact: "Medium Impact",
      icon: <FaPalette />,
      description: "Poor color contrast makes text difficult to read for users with visual impairments or in different lighting conditions.",
      disabilityGroups: ["Low Vision", "Color Blind", "+1 more"],
      wcagCriteria: "Level AA",
      fixSteps: [
        "Ensure text has a contrast ratio of at least 4.5:1 with its background",
        "Use darker text colors or lighter backgrounds",
        "Test colors with online contrast checkers"
      ],
      estimatedTime: "45-90 minutes"
    });
  }
  
  // Empty links
  if (results.summary.emptyLinks > 0) {
    issues.push({
      title: "Empty or Unclear Links",
      count: results.summary.emptyLinks,
      severity: "serious",
      impact: "Medium Impact",
      icon: <FaLink />,
      description: "Links without descriptive text confuse screen reader users and hurt SEO.",
      disabilityGroups: ["Blind", "Cognitive", "+1 more"],
      wcagCriteria: "Level A",
      fixSteps: [
        "Add descriptive text to all links",
        "Avoid generic phrases like 'click here' or 'read more'",
        "Use aria-label for icon-only links"
      ],
      estimatedTime: "20-40 minutes"
    });
  }
  
  // Critical violations
  if (results.summary.criticalViolations > 0) {
    issues.push({
      title: "Critical Accessibility Violations",
      count: results.summary.criticalViolations,
      severity: "critical",
      impact: "High Impact",
      icon: <FaExclamationTriangle />,
      description: "Critical violations that significantly impact accessibility and may cause legal compliance issues.",
      disabilityGroups: ["Blind", "Motor", "+3 more"],
      wcagCriteria: "Level A",
      fixSteps: [
        "Review detailed report for specific violations",
        "Address heading structure issues",
        "Fix keyboard navigation problems"
      ],
      estimatedTime: "2-4 hours"
    });
  }
  
  // Sort by severity (critical first) and return top 5
  return issues
    .sort((a, b) => a.severity === 'critical' && b.severity !== 'critical' ? -1 : 1)
    .slice(0, 5);
};

const getQuickWins = (results) => {
  const wins = [];
  
  // Language declaration
  if (results.summary.languageScore !== null && results.summary.languageScore < 100) {
    wins.push({
      title: "Add Language Declaration",
      description: "Add lang attribute to your HTML tag for better screen reader support",
      icon: <FaLanguage />,
      time: "2 minutes"
    });
  }
  
  // Page title
  if (results.summary.structureScore !== null && results.summary.structureScore < 90) {
    wins.push({
      title: "Improve Page Title",
      description: "Ensure your page has a descriptive, unique title",
      icon: <FaFileAlt />,
      time: "5 minutes"
    });
  }
  
  // Skip links
  if (results.summary.hasSkipLinks === false) {
    wins.push({
      title: "Add Skip Links",
      description: "Add skip navigation links for keyboard users",
      icon: <FaArrowRight />,
      time: "10 minutes"
    });
  }
  
  return wins.slice(0, 3);
};

const ColorContrastSection = ({ analysis }) => {
  const { t } = useTranslation('dashboard');
  
  if (!analysis || analysis.totalViolations === 0) {
    return null;
  }

  return (
    <>
      <ColorContrastOverview>
        <ContrastCard>
          <ContrastValue color="#dc2626">{analysis.totalViolations}</ContrastValue>
          <ContrastLabel>{t('colorContrast.totalViolations')}</ContrastLabel>
          <ContrastDescription>{t('colorContrast.totalDescription')}</ContrastDescription>
        </ContrastCard>
        
        <ContrastCard>
          <ContrastValue color="#dc2626">{analysis.aaViolations}</ContrastValue>
          <ContrastLabel>{t('colorContrast.aaViolations')}</ContrastLabel>
          <ContrastDescription>{t('colorContrast.aaDescription')}</ContrastDescription>
        </ContrastCard>
        
        <ContrastCard>
          <ContrastValue color="#f59e0b">{analysis.aaaViolations || 0}</ContrastValue>
          <ContrastLabel>{t('colorContrast.aaaViolations')}</ContrastLabel>
          <ContrastDescription>{t('colorContrast.aaaDescription')}</ContrastDescription>
        </ContrastCard>
        
        {analysis.summary && (
          <ContrastCard>
            <ContrastValue color={analysis.summary.aaComplianceLevel >= 90 ? '#10b981' : '#dc2626'}>
              {analysis.summary.aaComplianceLevel}%
            </ContrastValue>
            <ContrastLabel>{t('colorContrast.aaCompliance')}</ContrastLabel>
            <ContrastDescription>{t('colorContrast.complianceDescription')}</ContrastDescription>
          </ContrastCard>
        )}
      </ColorContrastOverview>

      {/* Simplified actionable guidance instead of repetitive examples */}
      {analysis.violations && analysis.violations.colorContrast && analysis.violations.colorContrast.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
            {t('colorContrast.actionGuidance')}
          </h4>
          <div style={{ 
            background: '#fef7f7', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>
              {t('colorContrast.mainIssue')}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              {t('colorContrast.elementsToFixWeb', { count: analysis.aaViolations })}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: '1.5' }}>
              {t('colorContrast.howToFixWeb')}
            </div>
          </div>
          
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bfdbfe', 
            borderRadius: '6px', 
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.8125rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
              💡 {t('colorContrast.quickTip')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
              {t('colorContrast.quickTipDetails')}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradingToDetailed, setUpgradingToDetailed] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState([]);
  const navigate = useNavigate();
  const { i18n, t } = useTranslation('dashboard');
  
  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResult');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (error) {
        console.error('Error parsing stored results:', error);
        toast.error(t('results.messages.errorLoadingResults'));
      }
    } else {
      toast.info(t('results.messages.noResultsFound'));
    }
    
    setLoading(false);
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const handleUpgradeToDetailed = async () => {
    if (!results) return;
    
    setUpgradingToDetailed(true);
    
    try {
      toast.info(t('results.messages.loadingDetailedReport'), { autoClose: 2000 });
      
      const detailedResult = await accessibilityAPI.getDetailedReport(results.analysisId, i18n.language);
      
      if (detailedResult.success) {
        setResults(detailedResult.data);
        sessionStorage.setItem('analysisResult', JSON.stringify(detailedResult.data));
        toast.success(t('results.messages.detailedReportLoaded'));
      } else {
        toast.error(t('results.messages.failedLoadDetailedReport'));
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error.message || t('results.messages.failedLoadDetailedReport'));
    } finally {
      setUpgradingToDetailed(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    
    setDownloadingPDF(true);
    
    try {
      toast.info(t('results.messages.downloadingPdfReport'), { autoClose: 2000 });
      
      await accessibilityAPI.downloadPDF(results.analysisId, i18n.language);
      toast.success(t('results.messages.pdfReportDownloaded'));
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(error.message || t('results.messages.failedDownloadPdf'));
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownload = async () => {
    if (!results) return;
    
    // Only detailed reports can be downloaded as PDF
    if (results.reportType === 'detailed') {
      return handleDownloadPDF();
    }
    
    // Overview reports don't have download functionality
    toast.info(t('results.messages.downloadAvailableInDetailed'));
  };

  if (loading) {
    return (
      <ResultsContainer>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <LoadingSpinner size="large" />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading results...</p>
        </div>
      </ResultsContainer>
    );
  }

  if (!results) {
    return (
      <ResultsContainer>
        <NoResultsMessage>
          <NoResultsTitle>{t('results.noResults.title')}</NoResultsTitle>
          <NoResultsText>
            {t('results.noResults.description')}
          </NoResultsText>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            {t('results.buttons.backToHome')}
          </BackButton>
        </NoResultsMessage>
      </ResultsContainer>
    );
  }

  // Helper functions for converting violations to AccessibilityIssue format
  const convertViolationsToIssues = (violations) => {
    if (!violations || !Array.isArray(violations)) return [];
    
    return violations.map((violation, index) => {
      return new AccessibilityIssue({
        id: `violation-${index}`,
        title: violation.help || violation.description || 'Unknown Issue',
        description: violation.description || '',
        severity: mapSeverityToIssueLevel(violation.impact),
        category: getIssueCategory(violation.id),
        wcagCriteria: violation.tags
          ?.filter(tag => tag.startsWith('wcag'))
          ?.map(tag => tag.replace('wcag', '').replace(/(\d)(\d)/g, '$1.$2'))
          ?.slice(0, 3) || [],
        elements: violation.nodes?.map(node => ({
          selector: node.target?.join(', ') || '',
          html: node.html || '',
          failureSummary: node.failureSummary || ''
        })) || [],
        remediation: {
          summary: violation.help || 'Fix this accessibility issue',
          steps: violation.nodes?.[0]?.all?.map(check => check.message) || [],
          resources: [violation.helpUrl].filter(Boolean)
        }
      });
    });
  };

  const mapSeverityToIssueLevel = (impact) => {
    switch (impact) {
      case 'critical': return 'critical';
      case 'serious': return 'serious';
      case 'moderate': return 'moderate';
      case 'minor': return 'minor';
      default: return 'moderate';
    }
  };

  const getIssueCategory = (violationId) => {
    if (violationId.includes('color') || violationId.includes('contrast')) return 'color-contrast';
    if (violationId.includes('image') || violationId.includes('alt')) return 'images';
    if (violationId.includes('form') || violationId.includes('label')) return 'forms';
    if (violationId.includes('keyboard') || violationId.includes('focus')) return 'keyboard';
    if (violationId.includes('heading') || violationId.includes('structure')) return 'structure';
    if (violationId.includes('aria')) return 'aria';
    return 'other';
  };

  const handleIssueToggle = (issueId) => {
    setExpandedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  return (
    <ResultsContainer>
      <Header>
        <HeaderLeft>
          <Title>
            {t('results.title')}
            <ReportTypeBadge type={results.reportType}>
              {results.reportType === 'detailed' ? (
                <>
                  <FaCrown /> {t('results.reportTypes.premiumReport')}
                </>
              ) : (
                t('results.reportTypes.overviewReport')
              )}
            </ReportTypeBadge>
          </Title>
          <Subtitle>{results.url}</Subtitle>
          <AnalysisInfo>
            <span>{t('results.analysisId')}: {results.analysisId}</span>
            <span>•</span>
            <span>{t('results.generated')}: {new Date(results.timestamp).toLocaleString()}</span>
          </AnalysisInfo>
        </HeaderLeft>
        <HeaderRight>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            {t('results.buttons.backToHome')}
          </BackButton>
          
          {results.reportType === 'detailed' ? (
            <DownloadButton 
              premium 
              onClick={handleDownload} 
              disabled={downloadingPDF}
            >
              {downloadingPDF ? (
                <>
                  <LoadingSpinner size="small" />
                  {t('results.messages.generatingPdf')}
                </>
              ) : (
                <>
                  <FaDownload />
                  {t('results.buttons.downloadPdfReport')}
                </>
              )}
            </DownloadButton>
          ) : (
            <UpgradeButton 
              onClick={handleUpgradeToDetailed}
              disabled={upgradingToDetailed}
            >
              {upgradingToDetailed ? (
                <>
                  <LoadingSpinner size="small" />
                  {t('results.messages.upgrading')}
                </>
              ) : (
                <>
                  <FaCrown />
                  {t('results.buttons.getDetailedReportPdf')}
                </>
              )}
            </UpgradeButton>
          )}
        </HeaderRight>
      </Header>

      <ScoresSection>
        <ScoresGrid>
          <ScoreCard
            title={t('results.scores.accessibilityTitle')}
            score={results.scores.overall}
            description={t('results.scores.accessibilityDescription')}
            color={results.scores.overall >= 80 ? '#10b981' : results.scores.overall >= 60 ? '#f59e0b' : '#ef4444'}
            enhanced={true}
            wcagBreakdown={{
              critical: results.summary?.criticalViolations || 0,
              passed: results.summary?.passedChecks || 0,
              manual: results.summary?.manualChecks || 0,
              notApplicable: results.summary?.notApplicable || 0
            }}
          />
        </ScoresGrid>
      </ScoresSection>

      {/* Overview Report Critical Issues Section */}
      <CriticalIssuesSection>
        <SectionTitle>{t('results.overview.criticalIssues')}</SectionTitle>
        <CriticalIssuesList>
          {getCriticalIssues(results).map((issue, index) => (
            <CriticalIssueCard key={index}>
              <IssueHeader>
                <IssueIcon color={issue.severity === 'critical' ? '#ef4444' : '#f59e0b'}>
                  {issue.icon}
                </IssueIcon>
                <IssueInfo>
                  <IssueTitle>{issue.title}</IssueTitle>
                  <IssueCount>{issue.count} instance{issue.count !== 1 ? 's' : ''} found</IssueCount>
                  <IssueMetadata>
                    <ElementCount>{issue.count} elements</ElementCount>
                    <DisabilityImpactBadges>
                      {issue.disabilityGroups.map((group, groupIndex) => (
                        <DisabilityBadge key={groupIndex}>{group}</DisabilityBadge>
                      ))}
                    </DisabilityImpactBadges>
                    <WcagBadge>{issue.wcagCriteria}</WcagBadge>
                  </IssueMetadata>
                </IssueInfo>
                <ImpactBadge severity={issue.severity}>
                  {issue.impact}
                </ImpactBadge>
              </IssueHeader>
              <IssueDescription>{issue.description}</IssueDescription>
              <FixGuidance>
                <FixTitle>How to fix:</FixTitle>
                <FixSteps>
                  {issue.fixSteps.map((step, stepIndex) => (
                    <FixStep key={stepIndex}>{step}</FixStep>
                  ))}
                </FixSteps>
                <FixTime>Estimated time: {issue.estimatedTime}</FixTime>
              </FixGuidance>
              <FixIssuesButton onClick={() => console.log('Fix issues clicked for:', issue.title)}>
                <FaCheckCircle /> Fix Issues
              </FixIssuesButton>
            </CriticalIssueCard>
          ))}
        </CriticalIssuesList>
      </CriticalIssuesSection>

      {/* Quick Wins Section */}
      <QuickWinsSection>
        <SectionTitle>{t('results.overview.quickWins')}</SectionTitle>
        <QuickWinsGrid>
          {getQuickWins(results).map((win, index) => (
            <QuickWinCard key={index}>
              <QuickWinIcon color="#10b981">
                {win.icon}
              </QuickWinIcon>
              <QuickWinTitle>{win.title}</QuickWinTitle>
              <QuickWinDescription>{win.description}</QuickWinDescription>
              <QuickWinTime>{win.time}</QuickWinTime>
            </QuickWinCard>
          ))}
        </QuickWinsGrid>
      </QuickWinsSection>

      {results.reportType === 'detailed' ? (
        <>
          <Section>
            <SectionTitle>{t('results.sections.recommendations')}</SectionTitle>
            <RecommendationsList recommendations={results.recommendations} />
          </Section>
          
          {/* Enhanced Analysis Sections for detailed reports */}
          {results.forms?.errorHandling && (
            <Section>
              <SectionTitle>Form Error Handling Analysis</SectionTitle>
              <SummaryGrid>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.forms.errorHandling.errorElementsFound || 0}</SummaryValue>
                  <SummaryLabel>Error Elements Found</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.forms.errorHandling.errorIdentification?.controlsWithProperErrorAssociation > 0 ? "#10b981" : "#ef4444"}>
                    <FaCheckCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.forms.errorHandling.errorIdentification?.controlsWithProperErrorAssociation || 0}</SummaryValue>
                  <SummaryLabel>Proper Error Association</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaInfoCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.forms.errorHandling.labelsAndInstructions?.controlsWithInstructions || 0}</SummaryValue>
                  <SummaryLabel>Controls With Instructions</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.forms.errorHandling.overallScore >= 80 ? "#10b981" : results.forms.errorHandling.overallScore >= 60 ? "#f59e0b" : "#ef4444"}>
                    <FaStar />
                  </SummaryIcon>
                  <SummaryValue>{results.forms.errorHandling.overallScore || 0}%</SummaryValue>
                  <SummaryLabel>Error Handling Score</SummaryLabel>
                </SummaryCard>
              </SummaryGrid>
            </Section>
          )}

          {results.customChecks?.formAnalysis && results.customChecks.formAnalysis.totalForms > 0 && (
            <Section>
              <SectionTitle>Form Accessibility Analysis</SectionTitle>
              <SummaryGrid>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaWpforms />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.formAnalysis.totalForms}</SummaryValue>
                  <SummaryLabel>Total Forms</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.customChecks.formAnalysis.inputAnalysis?.withoutLabels > 0 ? "#ef4444" : "#10b981"}>
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.formAnalysis.inputAnalysis?.withoutLabels || 0}</SummaryValue>
                  <SummaryLabel>Unlabeled Inputs</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.customChecks.formAnalysis.buttonAnalysis?.withoutText > 0 ? "#ef4444" : "#10b981"}>
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.formAnalysis.buttonAnalysis?.withoutText || 0}</SummaryValue>
                  <SummaryLabel>Unlabeled Buttons</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaInfoCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.formAnalysis.inputAnalysis?.required || 0}</SummaryValue>
                  <SummaryLabel>Required Fields</SummaryLabel>
                </SummaryCard>
              </SummaryGrid>
            </Section>
          )}

          {results.structure?.languageValidation && (
            <Section>
              <SectionTitle>Language Declaration Analysis</SectionTitle>
              <SummaryGrid>
                <SummaryCard>
                  <SummaryIcon color={results.structure.languageValidation.hasLangAttribute ? "#10b981" : "#ef4444"}>
                    <FaLanguage />
                  </SummaryIcon>
                  <SummaryValue>{results.structure.languageValidation.hasLangAttribute ? "✓" : "✗"}</SummaryValue>
                  <SummaryLabel>Lang Attribute Present</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.structure.languageValidation.isValidLangCode ? "#10b981" : "#ef4444"}>
                    <FaCheckCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.structure.languageValidation.isValidLangCode ? "Valid" : "Invalid"}</SummaryValue>
                  <SummaryLabel>Language Code</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaInfoCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.structure.languageValidation.langValue || "None"}</SummaryValue>
                  <SummaryLabel>Current Value</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.structure.languageValidation.issues?.length > 0 ? "#ef4444" : "#10b981"}>
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.structure.languageValidation.issues?.length || 0}</SummaryValue>
                  <SummaryLabel>Language Issues</SummaryLabel>
                </SummaryCard>
              </SummaryGrid>
            </Section>
          )}

          {results.customChecks?.ariaAnalysis && (
            <Section>
              <SectionTitle>ARIA Implementation Analysis</SectionTitle>
              <SummaryGrid>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaInfoCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.ariaAnalysis.elementsWithAriaLabel || 0}</SummaryValue>
                  <SummaryLabel>ARIA Labeled Elements</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.customChecks.ariaAnalysis.landmarkIssues?.length > 0 ? "#ef4444" : "#10b981"}>
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.ariaAnalysis.landmarkIssues?.length || 0}</SummaryValue>
                  <SummaryLabel>Landmark Issues</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaInfoCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.ariaAnalysis.liveRegions || 0}</SummaryValue>
                  <SummaryLabel>Live Regions</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.customChecks.ariaAnalysis.invalidFields > 0 ? "#ef4444" : "#10b981"}>
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.ariaAnalysis.invalidFields || 0}</SummaryValue>
                  <SummaryLabel>Invalid Fields</SummaryLabel>
                </SummaryCard>
              </SummaryGrid>
            </Section>
          )}

          {results.customChecks?.tableAnalysis && results.customChecks.tableAnalysis.total > 0 && (
            <Section>
              <SectionTitle>Table Accessibility Analysis</SectionTitle>
              <SummaryGrid>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaWpforms />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.tableAnalysis.total}</SummaryValue>
                  <SummaryLabel>Total Tables</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.customChecks.tableAnalysis.withCaptions === results.customChecks.tableAnalysis.total ? "#10b981" : "#ef4444"}>
                    <FaCheckCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.tableAnalysis.withCaptions}</SummaryValue>
                  <SummaryLabel>With Captions</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.customChecks.tableAnalysis.withHeaders === results.customChecks.tableAnalysis.total ? "#10b981" : "#ef4444"}>
                    <FaCheckCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.tableAnalysis.withHeaders}</SummaryValue>
                  <SummaryLabel>With Headers</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.customChecks.tableAnalysis.issues?.length > 0 ? "#ef4444" : "#10b981"}>
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.customChecks.tableAnalysis.issues?.length || 0}</SummaryValue>
                  <SummaryLabel>Table Issues</SummaryLabel>
                </SummaryCard>
              </SummaryGrid>
            </Section>
          )}

          {results.keyboardAnalysis && (
            <Section>
              <SectionTitle>Keyboard Accessibility Analysis</SectionTitle>
              <SummaryGrid>
                <SummaryCard>
                  <SummaryIcon color="#6b7280">
                    <FaLink />
                  </SummaryIcon>
                  <SummaryValue>{results.keyboardAnalysis.focusableElements?.length || 0}</SummaryValue>
                  <SummaryLabel>Focusable Elements</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.keyboardAnalysis.skipLinks?.length > 0 ? "#10b981" : "#ef4444"}>
                    <FaCheckCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.keyboardAnalysis.skipLinks?.length || 0}</SummaryValue>
                  <SummaryLabel>Skip Links</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.keyboardAnalysis.focusTraps?.length > 0 ? "#ef4444" : "#10b981"}>
                    <FaExclamationTriangle />
                  </SummaryIcon>
                  <SummaryValue>{results.keyboardAnalysis.focusTraps?.length || 0}</SummaryValue>
                  <SummaryLabel>Focus Traps</SummaryLabel>
                </SummaryCard>
                <SummaryCard>
                  <SummaryIcon color={results.keyboardAnalysis.focusManagement?.hasLogicalTabOrder ? "#10b981" : "#ef4444"}>
                    <FaCheckCircle />
                  </SummaryIcon>
                  <SummaryValue>{results.keyboardAnalysis.focusManagement?.hasLogicalTabOrder ? 'Yes' : 'No'}</SummaryValue>
                  <SummaryLabel>Logical Tab Order</SummaryLabel>
                </SummaryCard>
              </SummaryGrid>
            </Section>
          )}

          {/* Navigation Analysis */}
          {results.navigation && (
            <NavigationResults navigationData={results.navigation} />
          )}

          {/* Touch Target Analysis */}
          {results.touchTargets && (
            <TouchTargetResults touchTargetData={results.touchTargets} />
          )}

          {/* Keyboard Shortcut Analysis */}
          {results.keyboardShortcuts && (
            <KeyboardShortcutResults keyboardShortcutData={results.keyboardShortcuts} />
          )}

          {/* Content Structure Analysis */}
          {results.contentStructure && (
            <ContentStructureResults contentStructureData={results.contentStructure} />
          )}

          {/* Mobile Accessibility Analysis */}
          {results.mobileAccessibility && (
            <MobileAccessibilityResults mobileAccessibilityData={results.mobileAccessibility} />
          )}

          {/* Color Contrast Analysis for detailed reports */}
          {results.colorContrastAnalysis && results.colorContrastAnalysis.totalViolations > 0 && (
            <Section>
              <SectionTitle>{t('results.sections.colorContrastAnalysis')}</SectionTitle>
              <ColorContrastSection analysis={results.colorContrastAnalysis} />
            </Section>
          )}
          
          {/* Full violations list */}
          {results.axeResults && results.axeResults.violations && results.axeResults.violations.length > 0 && (
            <Section>
              <SectionTitle>{t('results.sections.accessibilityViolations')}</SectionTitle>
              <IssueTable
                issues={convertViolationsToIssues(results.axeResults.violations)}
                onIssueToggle={handleIssueToggle}
                expandedIssues={expandedIssues}
              />
            </Section>
          )}
        </>
      ) : (
        // Overview report shows very limited information
        <>
          {results.summary.hasExcellentAccessibility ? (
            // Show excellent accessibility message
            <Section>
              <SectionTitle>{t('results.sections.excellentAccessibility')}</SectionTitle>
              <ExcellentAccessibilitySection>
                <ExcellentIcon>
                  <FaCheckCircle />
                </ExcellentIcon>
                <ExcellentTitle>
                  {t('results.excellent.title')}
                </ExcellentTitle>
                <ExcellentDescription>
                  {t('results.excellent.description')}
                </ExcellentDescription>
                <ExcellentDescription>
                  {t('results.excellent.noUpgradeNeeded')}
                </ExcellentDescription>
              </ExcellentAccessibilitySection>
            </Section>
          ) : results.issuePreview && results.issuePreview.hasViolations ? (
            <Section>
              <SectionTitle>{t('results.sections.issuesFound')}</SectionTitle>
              <LockedSection>
                <LockIcon>
                  <FaLock />
                </LockIcon>
                <LockedTitle>
                  {t('results.issuePreview.criticalAndSeriousIssues', { critical: results.issuePreview.criticalIssues, serious: results.issuePreview.seriousIssues })}
                </LockedTitle>
                <LockedDescription>
                  {t('results.issuePreview.categoriesDetected', { categories: results.issuePreview.categories.join(', ') })}. 
                  {t('results.issuePreview.getDetailedReport')}
                </LockedDescription>
                <UpgradeButton 
                  onClick={handleUpgradeToDetailed}
                  disabled={upgradingToDetailed}
                >
                  {upgradingToDetailed ? (
                    <>
                      <LoadingSpinner size="small" />
                      {t('results.messages.loadingDetails')}
                    </>
                  ) : (
                    <>
                      <FaLock />
                      {t('results.buttons.unlockFullAnalysis')}
                    </>
                  )}
                </UpgradeButton>
              </LockedSection>
            </Section>
          ) : null}
          
          {!results.summary.hasExcellentAccessibility && (
            <PricingSection>
              <PricingTitle>
                <FaCrown />
                Get Your Complete Accessibility Analysis
              </PricingTitle>
              <PricingDescription>
                Unlock the full potential of your website with detailed insights and actionable recommendations.
              </PricingDescription>
              
              <PricingGrid>
                <PricingCard>
                  <PricingCardHeader>
                    <PricingCardTitle>Detailed Report</PricingCardTitle>
                    <PricingCardPrice>$79</PricingCardPrice>
                  </PricingCardHeader>
                  <PricingCardFeatures>
                    <PricingFeature>
                      <FaCheckCircle />
                      Complete analysis of all accessibility issues
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      Detailed technical recommendations
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      Downloadable PDF report
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      Code examples and implementation guides
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      Priority matrix for fixes
                    </PricingFeature>
                  </PricingCardFeatures>
                  <PricingCardButton 
                    onClick={handleUpgradeToDetailed}
                    disabled={upgradingToDetailed}
                  >
                    {upgradingToDetailed ? (
                      <>
                        <LoadingSpinner size="small" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaDownload />
                        Get Detailed Report
                      </>
                    )}
                  </PricingCardButton>
                </PricingCard>
                
                <PricingCard featured>
                  <PricingCardHeader>
                    <PricingCardTitle>Report + Consultation</PricingCardTitle>
                    <PricingCardPrice>$199</PricingCardPrice>
                    <PricingCardBadge>Most Popular</PricingCardBadge>
                  </PricingCardHeader>
                  <PricingCardFeatures>
                    <PricingFeature>
                      <FaCheckCircle />
                      Everything in Detailed Report
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      30-minute expert consultation
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      Personalized implementation strategy
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      Live Q&A with accessibility expert
                    </PricingFeature>
                    <PricingFeature>
                      <FaCheckCircle />
                      Follow-up recommendations
                    </PricingFeature>
                  </PricingCardFeatures>
                  <PricingCardButton 
                    featured
                    onClick={handleUpgradeToDetailed}
                    disabled={upgradingToDetailed}
                  >
                    {upgradingToDetailed ? (
                      <>
                        <LoadingSpinner size="small" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaStar />
                        Get Detailed Report
                      </>
                    )}
                  </PricingCardButton>
                </PricingCard>
              </PricingGrid>
            </PricingSection>
          )}
        </>
      )}
    </ResultsContainer>
  );
};

export default ResultsPage;