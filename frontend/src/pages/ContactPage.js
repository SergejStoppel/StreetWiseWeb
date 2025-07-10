import React, { useState } from 'react';
import styled from 'styled-components';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

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
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const HeroTitle = styled.h1`
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-inverse);
  line-height: var(--line-height-tight);
`;

const HeroSubtitle = styled.p`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-regular);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-inverse);
  opacity: 0.9;
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
  line-height: var(--line-height-relaxed);
`;

const ContactSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const ContactContent = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--spacing-4xl);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
    gap: var(--spacing-5xl);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
    max-width: 90%;
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
  font-size: var(--font-size-3xl);
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
  min-height: 140px;
  
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

const FormSelect = styled.select`
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-family-secondary);
  font-size: var(--font-size-base);
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

const ContactInfo = styled.div``;

const InfoTitle = styled.h2`
  font-size: var(--font-size-3xl);
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
  border-radius: var(--border-radius-xl);
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
  width: 3.5rem;
  height: 3.5rem;
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.h3`
  font-size: var(--font-size-xl);
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

const ResponseTimeCard = styled.div`
  background: linear-gradient(135deg, var(--color-success-light) 0%, var(--color-success-lighter) 100%);
  border: 1px solid var(--color-success);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-md);
`;

const ResponseTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-success-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
`;

const ResponseText = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-success-dark);
  line-height: var(--line-height-relaxed);
`;

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: '',
    website: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      alert('Thank you for your message! We\'ll get back to you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        service: '',
        website: '',
        message: ''
      });
    }, 2000);
  };

  return (
    <ContactContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Get In Touch</HeroTitle>
          <HeroSubtitle>
            Ready to transform your website? Let's discuss how we can help your business grow online.
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <ContactSection>
        <ContactContent>
          <ContactForm onSubmit={handleSubmit}>
            <FormTitle>Send Us a Message</FormTitle>
            
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
              <FormLabel htmlFor="company">Company Name</FormLabel>
              <FormInput
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your business name"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="phone">Phone Number</FormLabel>
              <FormInput
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="service">Service of Interest</FormLabel>
              <FormSelect
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
              >
                <option value="">Select a service</option>
                <option value="accessibility">Website Accessibility</option>
                <option value="seo">SEO & Content Marketing</option>
                <option value="overhaul">Website Overhaul</option>
                <option value="multiple">Multiple Services</option>
                <option value="consultation">General Consultation</option>
              </FormSelect>
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="website">Current Website URL</FormLabel>
              <FormInput
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.yourbusiness.com"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="message">Message *</FormLabel>
              <FormTextarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about your project, goals, and any specific challenges you're facing..."
                required
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'} <FaArrowRight />
            </SubmitButton>
          </ContactForm>

          <ContactInfo>
            <InfoTitle>Contact Information</InfoTitle>
            
            <InfoGrid>
              <InfoCard>
                <InfoIcon>
                  <FaEnvelope />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Email Us</InfoLabel>
                  <InfoText>hello@sitecraft.ai</InfoText>
                  <InfoText>For general inquiries and support</InfoText>
                </InfoContent>
              </InfoCard>

              <InfoCard>
                <InfoIcon>
                  <FaPhone />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Call Us</InfoLabel>
                  <InfoText>(555) 123-SITE</InfoText>
                  <InfoText>Mon-Fri, 9 AM - 6 PM EST</InfoText>
                </InfoContent>
              </InfoCard>

              <InfoCard>
                <InfoIcon>
                  <FaMapMarkerAlt />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Location</InfoLabel>
                  <InfoText>Serving small businesses nationwide</InfoText>
                  <InfoText>Remote consultations available</InfoText>
                </InfoContent>
              </InfoCard>

              <InfoCard>
                <InfoIcon>
                  <FaClock />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Business Hours</InfoLabel>
                  <InfoText>Monday - Friday: 9:00 AM - 6:00 PM EST</InfoText>
                  <InfoText>Saturday: 10:00 AM - 2:00 PM EST</InfoText>
                </InfoContent>
              </InfoCard>
            </InfoGrid>

            <ResponseTimeCard>
              <ResponseTitle>
                <FaCheckCircle /> Quick Response Guarantee
              </ResponseTitle>
              <ResponseText>
                We respond to all inquiries within 24 hours during business days. 
                For urgent accessibility or technical issues, we offer same-day response for existing clients.
              </ResponseText>
            </ResponseTimeCard>
          </ContactInfo>
        </ContactContent>
      </ContactSection>
    </ContactContainer>
  );
};

export default ContactPage;