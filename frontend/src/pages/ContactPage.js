import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEnvelope, FaPhone, FaClock, FaArrowRight, FaCheckCircle, FaRocket } from 'react-icons/fa';

const ContactContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-surface-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-4xl) 0 var(--spacing-2xl);
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  color: var(--color-text-inverse);
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: 0 var(--spacing-md);
  }
`;

const HeroTitle = styled.h1`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-inverse);
  line-height: var(--line-height-tight);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

const HeroSubtitle = styled.p`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-regular);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-inverse);
  opacity: 0.95;
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
  line-height: var(--line-height-relaxed);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-lg);
  }
`;

const ContactSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const ContactContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4xl);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-3xl);
    padding: 0 var(--spacing-md);
  }
`;

const ContactForm = styled.form`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-primary);
`;

const FormTitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

const FormInput = styled.input`
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-family-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-surface-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    background-color: var(--color-surface-elevated);
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-family-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
  background-color: var(--color-surface-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-fast);
  resize: vertical;
  min-height: 120px;
  
  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    background-color: var(--color-surface-elevated);
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--border-radius-lg);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  
  &:hover:not(:disabled) {
    background-color: var(--color-interactive-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Microcopy = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-sm);
  text-align: center;
  font-family: var(--font-family-secondary);
`;

const ContactInfo = styled.div``;

const InfoTitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
`;

const InfoGrid = styled.div`
  display: grid;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
`;

const InfoCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const InfoIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const InfoText = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-xs);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const BusinessHoursSection = styled.section`
  background-color: var(--color-surface-secondary);
  padding: var(--spacing-4xl) 0;
`;

const BusinessHoursContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: 0 var(--spacing-md);
  }
`;

const BusinessHoursTitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
`;

const BusinessHoursGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
`;

const BusinessHoursCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  text-align: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-fast);
  }
`;

const BusinessHoursIcon = styled.div`
  font-size: var(--font-size-3xl);
  color: var(--color-interactive-primary);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: center;
`;

const BusinessHoursText = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-sm);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ResponseTimeCard = styled.div`
  background: linear-gradient(135deg, var(--color-success-100) 0%, var(--color-surface-elevated) 100%);
  border: 1px solid var(--color-success-300);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-md);
  max-width: 600px;
  margin: 0 auto;
`;

const ResponseTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
`;

const ResponseText = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const FreeAnalysisSection = styled.section`
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  color: var(--color-text-inverse);
  padding: var(--spacing-4xl) 0;
  text-align: center;
`;

const FreeAnalysisContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: 0 var(--spacing-md);
  }
`;

const FreeAnalysisTitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-inverse);
`;

const FreeAnalysisText = styled.p`
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-2xl);
  opacity: 0.95;
  color: var(--color-text-inverse);
  font-family: var(--font-family-secondary);
  line-height: var(--line-height-relaxed);
`;

const FreeAnalysisButton = styled.button`
  background: var(--color-warning);
  color: var(--color-text-primary);
  padding: var(--spacing-lg) var(--spacing-2xl);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-lg);
  
  &:hover:not(:disabled) {
    background: var(--color-warning-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Thank you for your message! We\'ll get back to you within 24 business hours.');
      setFormData({
        name: '',
        email: '',
        message: ''
      });
    }, 2000);
  };

  const handleFreeAnalysis = () => {
    navigate('/');
    // Scroll to the top form after navigation
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <ContactContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Have Questions? We're Here to Help!</HeroTitle>
          <HeroSubtitle>
            We know running a small business keeps you busy. If you have questions about your website, our services, or just want to chat about how to get more customers online, we're here to listen. No question is too small, and no tech jargon required!
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <ContactSection>
        <ContactContent>
          <ContactForm onSubmit={handleSubmit}>
            <FormTitle>Send Us a Quick Message</FormTitle>
            
            <FormGroup>
              <FormLabel htmlFor="name">Full Name *</FormLabel>
              <FormInput
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="email">Email Address *</FormLabel>
              <FormInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="message">Message *</FormLabel>
              <FormTextarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us what's on your mind..."
                required
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send My Message'} <FaArrowRight />
            </SubmitButton>
            
            <Microcopy>
              We'll get back to you within 24 business hours.
            </Microcopy>
          </ContactForm>

          <ContactInfo>
            <InfoTitle>Or Reach Out Directly</InfoTitle>
            
            <InfoGrid>
              <InfoCard>
                <InfoIcon>
                  <FaEnvelope />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Email Us</InfoLabel>
                  <InfoText>hello@streetwiseweb.com</InfoText>
                  <InfoText>For general inquiries, support, or to discuss your free report.</InfoText>
                </InfoContent>
              </InfoCard>

              <InfoCard>
                <InfoIcon>
                  <FaPhone />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Call Us</InfoLabel>
                  <InfoText>(XXX) XXX-XXXX</InfoText>
                  <InfoText>Speak directly with a friendly expert.</InfoText>
                </InfoContent>
              </InfoCard>
            </InfoGrid>
          </ContactInfo>
        </ContactContent>
      </ContactSection>

      <BusinessHoursSection>
        <BusinessHoursContent>
          <BusinessHoursTitle>When We're Available</BusinessHoursTitle>
          
          <BusinessHoursGrid>
            <BusinessHoursCard>
              <BusinessHoursIcon>
                <FaClock />
              </BusinessHoursIcon>
              <InfoLabel>Business Hours</InfoLabel>
              <BusinessHoursText>Monday - Friday: 9:00 AM - 6:00 PM EST</BusinessHoursText>
              <BusinessHoursText>Saturday: 10:00 AM - 2:00 PM EST</BusinessHoursText>
            </BusinessHoursCard>
          </BusinessHoursGrid>

          <ResponseTimeCard>
            <ResponseTitle>
              <FaCheckCircle /> Quick Response Promise
            </ResponseTitle>
            <ResponseText>
              We aim to respond to all messages within 24 business hours. Your online success is important to us!
            </ResponseText>
          </ResponseTimeCard>
        </BusinessHoursContent>
      </BusinessHoursSection>

      <FreeAnalysisSection>
        <FreeAnalysisContent>
          <FreeAnalysisTitle>Haven't Gotten Your Free Report Yet?</FreeAnalysisTitle>
          <FreeAnalysisText>
            If you're curious about your website's current health, start with our free, no-obligation analysis. It's the easiest way to see where you stand!
          </FreeAnalysisText>
          
          <FreeAnalysisButton onClick={handleFreeAnalysis}>
            <FaRocket /> Get My Free Website Report
          </FreeAnalysisButton>
        </FreeAnalysisContent>
      </FreeAnalysisSection>
    </ContactContainer>
  );
};

export default ContactPage;