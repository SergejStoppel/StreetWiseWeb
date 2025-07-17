-- =============================================
-- SAMPLE DATA FOR STREETWISEWEB DATABASE
-- =============================================
-- Run this AFTER creating the schema and AFTER creating a user account
-- This will help you test the database structure

-- =============================================
-- IMPORTANT: First create a user account through your app
-- Then replace 'your-user-id-here' with your actual user ID from auth.users
-- =============================================

-- Insert sample user profile (replace with your actual user ID)
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
INSERT INTO public.user_profiles (id, email, first_name, last_name, company, plan_type) 
VALUES (
    'your-user-id-here', -- Replace with actual user ID
    'demo@streetwiseweb.com',
    'John',
    'Doe',
    'StreetWiseWeb Demo',
    'free'
) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    company = EXCLUDED.company;

-- Insert sample projects
INSERT INTO public.projects (id, user_id, name, description, website_url) VALUES
(
    'project-1-uuid',
    'your-user-id-here', -- Replace with actual user ID
    'Main Company Website',
    'Primary website accessibility analysis',
    'https://example.com'
),
(
    'project-2-uuid',
    'your-user-id-here', -- Replace with actual user ID
    'Client Portfolio Site',
    'Portfolio website for design client',
    'https://client-portfolio.com'
);

-- Insert sample analysis
INSERT INTO public.analyses (
    id, 
    user_id, 
    project_id, 
    url, 
    report_type, 
    language,
    overall_score,
    accessibility_score,
    seo_score,
    performance_score,
    analysis_data,
    metadata,
    status
) VALUES (
    'analysis-1-uuid',
    'your-user-id-here', -- Replace with actual user ID
    'project-1-uuid',
    'https://example.com',
    'overview',
    'en',
    85,
    78,
    92,
    88,
    '{
        "summary": {
            "totalIssues": 12,
            "criticalIssues": 2,
            "seriousIssues": 4,
            "moderateIssues": 6
        },
        "categories": {
            "images": {
                "score": 70,
                "issues": ["Missing alt text", "Poor image descriptions"]
            },
            "forms": {
                "score": 85,
                "issues": ["Missing form labels"]
            },
            "navigation": {
                "score": 90,
                "issues": []
            }
        },
        "axeResults": {
            "violations": [],
            "passes": [],
            "incomplete": []
        }
    }'::jsonb,
    '{
        "analysisTime": "2024-01-15T10:30:00Z",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "pageLoadTime": 1250,
        "totalElements": 156
    }'::jsonb,
    'completed'
);

-- Insert sample analysis issues
INSERT INTO public.analysis_issues (
    analysis_id,
    issue_id,
    title,
    description,
    severity,
    category,
    wcag_criteria,
    elements,
    remediation
) VALUES 
(
    'analysis-1-uuid',
    'missing-alt-text',
    'Images missing alt text',
    'Several images on the page are missing alternative text, making them inaccessible to screen readers.',
    'serious',
    'images',
    '["1.1.1"]'::jsonb,
    '[{"selector": "img.hero-image", "html": "<img src=\"hero.jpg\" class=\"hero-image\">"}]'::jsonb,
    '{
        "suggestion": "Add descriptive alt text to all images",
        "example": "<img src=\"hero.jpg\" alt=\"Company team working together\" class=\"hero-image\">",
        "priority": "high"
    }'::jsonb
),
(
    'analysis-1-uuid',
    'form-missing-labels',
    'Form inputs missing labels',
    'Some form inputs do not have associated labels, making them difficult to use with assistive technologies.',
    'serious',
    'forms',
    '["1.3.1", "3.3.2"]'::jsonb,
    '[{"selector": "input#email", "html": "<input type=\"email\" id=\"email\" placeholder=\"Email\">"}]'::jsonb,
    '{
        "suggestion": "Add proper labels to all form inputs",
        "example": "<label for=\"email\">Email Address</label><input type=\"email\" id=\"email\" name=\"email\">",
        "priority": "high"
    }'::jsonb
);

-- Insert sample usage logs
INSERT INTO public.usage_logs (user_id, action, resource_id, metadata) VALUES
(
    'your-user-id-here', -- Replace with actual user ID
    'analysis',
    'analysis-1-uuid',
    '{"url": "https://example.com", "duration": 15000}'::jsonb
),
(
    'your-user-id-here', -- Replace with actual user ID
    'project_created',
    'project-1-uuid',
    '{"projectName": "Main Company Website"}'::jsonb
),
(
    'your-user-id-here', -- Replace with actual user ID
    'report_generated',
    'analysis-1-uuid',
    '{"format": "json", "size": 1024}'::jsonb
);

-- Verify the data was inserted correctly
SELECT 'Sample data inserted successfully!' as message;

-- Query to verify the data
SELECT 
    'Data verification:' as info,
    (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count,
    (SELECT COUNT(*) FROM public.projects) as projects_count,
    (SELECT COUNT(*) FROM public.analyses) as analyses_count,
    (SELECT COUNT(*) FROM public.analysis_issues) as issues_count,
    (SELECT COUNT(*) FROM public.usage_logs) as usage_logs_count;