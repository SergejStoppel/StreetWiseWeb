import React from 'react';
import styled from 'styled-components';
import { FaCrown, FaPhone, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

const CTAContainer = styled.section`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 3rem;
  margin-top: 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    transform: rotate(45deg);
  }
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const CTAContent = styled.div`
  position: relative;
  z-index: 1;
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CTASubtitle = styled.p`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
`;

const CTAButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &.primary {
    background: white;
    color: #667eea;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid white;
    backdrop-filter: blur(10px);
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
  }
`;

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
`;

const Feature = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  text-align: left;
`;

const FeatureIcon = styled.div`
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const FeatureContent = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
`;

const PricingInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
  display: inline-block;
  backdrop-filter: blur(10px);
`;

const PricingText = styled.p`
  color: white;
  font-size: 1.1rem;
  margin: 0;
  
  strong {
    font-size: 1.5rem;
    font-weight: 700;
  }
`;

const CallToActionSection = ({ reportType, onUpgrade, onConsultation }) => {
  const isDetailedReport = reportType === 'detailed';

  if (isDetailedReport) {
    // Show consultation CTA for users who already have detailed report
    return (
      <CTAContainer>
        <CTAContent>
          <CTATitle>Need Expert Help?</CTATitle>
          <CTASubtitle>
            Get personalized guidance from our accessibility experts to implement these recommendations
          </CTASubtitle>
          
          <CTAButtons>
            <CTAButton className="primary" onClick={onConsultation}>
              <FaPhone />
              Schedule Free Consultation
            </CTAButton>
          </CTAButtons>
          
          <FeaturesList>
            <Feature>
              <FeatureIcon>
                <FaCheckCircle />
              </FeatureIcon>
              <FeatureContent>
                <FeatureTitle>Expert Review</FeatureTitle>
                <FeatureDescription>
                  Our experts will review your report and provide personalized recommendations
                </FeatureDescription>
              </FeatureContent>
            </Feature>
            
            <Feature>
              <FeatureIcon>
                <FaCheckCircle />
              </FeatureIcon>
              <FeatureContent>
                <FeatureTitle>Implementation Plan</FeatureTitle>
                <FeatureDescription>
                  Get a step-by-step roadmap to fix all accessibility issues
                </FeatureDescription>
              </FeatureContent>
            </Feature>
            
            <Feature>
              <FeatureIcon>
                <FaCheckCircle />
              </FeatureIcon>
              <FeatureContent>
                <FeatureTitle>Ongoing Support</FeatureTitle>
                <FeatureDescription>
                  Continue working with us to ensure long-term compliance
                </FeatureDescription>
              </FeatureContent>
            </Feature>
          </FeaturesList>
        </CTAContent>
      </CTAContainer>
    );
  }

  // Show upgrade CTA for users with overview report
  return (
    <CTAContainer>
      <CTAContent>
        <CTATitle>Get Your Complete Accessibility Report</CTATitle>
        <CTASubtitle>
          Unlock detailed insights, custom code fixes, and expert recommendations to make your website fully accessible
        </CTASubtitle>
        
        <CTAButtons>
          <CTAButton className="primary" onClick={onUpgrade}>
            <FaCrown />
            Get Detailed Report
            <FaArrowRight />
          </CTAButton>
          
          <CTAButton className="secondary" onClick={onConsultation}>
            <FaPhone />
            Get Report + Consultation
          </CTAButton>
        </CTAButtons>
        
        <PricingInfo>
          <PricingText>
            Detailed Report: <strong>$99</strong> | Report + Consultation: <strong>$299</strong>
          </PricingText>
        </PricingInfo>
        
        <FeaturesList>
          <Feature>
            <FeatureIcon>
              <FaCheckCircle />
            </FeatureIcon>
            <FeatureContent>
              <FeatureTitle>Complete Issue Analysis</FeatureTitle>
              <FeatureDescription>
                Every accessibility issue with code examples and fix instructions
              </FeatureDescription>
            </FeatureContent>
          </Feature>
          
          <Feature>
            <FeatureIcon>
              <FaCheckCircle />
            </FeatureIcon>
            <FeatureContent>
              <FeatureTitle>AI-Powered Insights</FeatureTitle>
              <FeatureDescription>
                Custom recommendations based on your industry and tech stack
              </FeatureDescription>
            </FeatureContent>
          </Feature>
          
          <Feature>
            <FeatureIcon>
              <FaCheckCircle />
            </FeatureIcon>
            <FeatureContent>
              <FeatureTitle>SEO Analysis</FeatureTitle>
              <FeatureDescription>
                Complete SEO audit with meta tags, content, and technical analysis
              </FeatureDescription>
            </FeatureContent>
          </Feature>
          
          <Feature>
            <FeatureIcon>
              <FaCheckCircle />
            </FeatureIcon>
            <FeatureContent>
              <FeatureTitle>Priority Matrix</FeatureTitle>
              <FeatureDescription>
                Know exactly what to fix first for maximum impact
              </FeatureDescription>
            </FeatureContent>
          </Feature>
          
          <Feature>
            <FeatureIcon>
              <FaCheckCircle />
            </FeatureIcon>
            <FeatureContent>
              <FeatureTitle>Custom Code Fixes</FeatureTitle>
              <FeatureDescription>
                Ready-to-use code snippets for your specific framework
              </FeatureDescription>
            </FeatureContent>
          </Feature>
          
          <Feature>
            <FeatureIcon>
              <FaCheckCircle />
            </FeatureIcon>
            <FeatureContent>
              <FeatureTitle>Professional PDF Report</FeatureTitle>
              <FeatureDescription>
                Share with your team or use for compliance documentation
              </FeatureDescription>
            </FeatureContent>
          </Feature>
        </FeaturesList>
      </CTAContent>
    </CTAContainer>
  );
};

export default CallToActionSection;