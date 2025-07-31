-- Extensions and Custom Types
-- This file sets up PostgreSQL extensions and custom enums

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom enums for type safety and consistency
CREATE TYPE workspace_role AS ENUM (
  'owner',
  'admin', 
  'member'
);

CREATE TYPE analysis_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

CREATE TYPE issue_severity AS ENUM (
  'critical',
  'serious',
  'moderate',
  'minor'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'past_due',
  'canceled',
  'trialing'
);

CREATE TYPE report_type AS ENUM (
  'free',
  'detailed'
);

CREATE TYPE purchase_status AS ENUM (
  'pending',
  'succeeded',
  'failed'
);

CREATE TYPE screenshot_type AS ENUM (
  'desktop',
  'mobile',
  'tablet',
  'full_page'
);