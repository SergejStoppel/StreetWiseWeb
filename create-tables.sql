-- SiteCraft Database Schema
-- Generated from Prisma schema for manual execution

-- Create ENUM types first
CREATE TYPE "AuditType" AS ENUM ('QUICK_SCAN', 'FULL_AUDIT', 'SEO_FOCUS', 'PERFORMANCE_FOCUS', 'ACCESSIBILITY_FOCUS');
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "ContentType" AS ENUM ('BLOG_POST_IDEAS', 'BLOG_POST_FULL', 'SOCIAL_MEDIA_POST', 'PRODUCT_DESCRIPTION', 'LANDING_PAGE_COPY');
CREATE TYPE "ContentStatus" AS ENUM ('GENERATED', 'EDITED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'PAST_DUE');

-- Create tables
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "websites" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "websites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "audit_type" "AuditType" NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "overall_score" INTEGER,
    "seo_score" INTEGER,
    "performance_score" INTEGER,
    "accessibility_score" INTEGER,
    "issues" JSONB,
    "suggestions" JSONB,
    "audit_data" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "location" TEXT,
    "target_audience" TEXT,
    "business_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generated_content" (
    "id" TEXT NOT NULL,
    "content_request_id" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'GENERATED',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_type" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- Add foreign key constraints
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "websites" ADD CONSTRAINT "websites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audits" ADD CONSTRAINT "audits_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_requests" ADD CONSTRAINT "content_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_content_request_id_fkey" FOREIGN KEY ("content_request_id") REFERENCES "content_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON "websites" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON "audits" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_requests_updated_at BEFORE UPDATE ON "content_requests" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON "generated_content" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON "subscriptions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();