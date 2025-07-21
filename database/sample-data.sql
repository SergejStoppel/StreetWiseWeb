-- =====================================================
-- STREETWISEWEB SAMPLE DATA
-- =====================================================
-- Sample data for testing the database structure
-- Version: 3.0 - Compatible with current schema
-- Run this AFTER setting up the database and creating a user account
-- 
-- IMPORTANT: Replace 'your-user-id-here' with your actual user ID from auth.users
-- You can get your user ID by running: SELECT id FROM auth.users LIMIT 1;
-- =====================================================

-- Variables for easy customization
-- Replace these UUIDs with actual values or generate new ones
DO $$
DECLARE
    sample_user_id UUID := 'your-user-id-here'; -- REPLACE THIS
    project1_id UUID := gen_random_uuid();
    project2_id UUID := gen_random_uuid();
    analysis1_id UUID := gen_random_uuid();
    analysis2_id UUID := gen_random_uuid();
    screenshot1_id UUID := gen_random_uuid();
    storage1_id UUID := gen_random_uuid();
BEGIN

-- =====================================================
-- 1. SAMPLE USER PROFILE
-- =====================================================

-- Note: The user must already exist in auth.users
-- This just updates their profile with sample data
UPDATE public.user_profiles 
SET 
    full_name = 'John Doe',
    company = 'Demo Company Ltd',
    plan_type = 'free',
    settings = '{
        "theme": "light",
        "language": "en",
        "notifications": {
            "email": true,
            "browser": false
        },
        "preferences": {
            "defaultReportType": "overview",
            "autoSaveProjects": true
        }
    }'::jsonb
WHERE id = sample_user_id;

-- If no user exists, create a warning
IF NOT FOUND THEN
    RAISE NOTICE '⚠️  WARNING: No user found with ID %. Please create a user account first!', sample_user_id;
    RETURN;
END IF;

-- =====================================================
-- 2. SAMPLE PROJECTS
-- =====================================================

INSERT INTO public.projects (id, user_id, name, description, website_url, settings) VALUES
(
    project1_id,
    sample_user_id,
    'Main Company Website',
    'Primary website accessibility analysis and monitoring',
    'https://example.com',
    '{
        "analysisFrequency": "weekly",
        "notifications": true,
        "reportFormat": "detailed",
        "targets": {
            "accessibilityScore": 90,
            "seoScore": 85,
            "performanceScore": 80
        }
    }'::jsonb
),
(
    project2_id,
    sample_user_id,
    'Client Portfolio Site',
    'Portfolio website accessibility testing for design client',
    'https://portfolio-client.example.com',
    '{
        "analysisFrequency": "monthly",
        "notifications": false,
        "reportFormat": "overview",
        "wcagLevel": "AA"
    }'::jsonb
);

-- =====================================================
-- 3. SAMPLE STORAGE OBJECTS
-- =====================================================

INSERT INTO public.storage_objects (id, user_id, analysis_id, bucket_id, object_path, file_size, mime_type) VALUES
(
    storage1_id,
    sample_user_id,
    analysis1_id, -- Will be created next
    'analysis-screenshots',
    'screenshots/2024/01/example-com-main.png',
    1024768,
    'image/png'
);

-- =====================================================
-- 4. SAMPLE ANALYSES
-- =====================================================

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
) VALUES 
(
    analysis1_id,
    sample_user_id,
    project1_id,
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
            "moderateIssues": 5,
            "minorIssues": 1
        },
        "categories": {
            "images": {
                "score": 70,
                "issueCount": 4,
                "description": "Image accessibility needs improvement"
            },
            "forms": {
                "score": 85,
                "issueCount": 2,
                "description": "Most forms are accessible"
            },
            "navigation": {
                "score": 95,
                "issueCount": 0,
                "description": "Navigation is fully accessible"
            },
            "colorContrast": {
                "score": 75,
                "issueCount": 3,
                "description": "Some color contrast issues found"
            },
            "headingStructure": {
                "score": 90,
                "issueCount": 1,
                "description": "Good heading structure with minor issues"
            },
            "keyboard": {
                "score": 88,
                "issueCount": 2,
                "description": "Most elements are keyboard accessible"
            }
        },
        "recommendations": [
            "Add alt text to all images",
            "Improve color contrast ratios",
            "Add missing form labels",
            "Fix keyboard navigation order"
        ]
    }'::jsonb,
    '{
        "analysisTime": "2024-01-15T10:30:00Z",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "pageLoadTime": 1250,
        "totalElements": 156,
        "analysisVersion": "3.0",
        "tools": ["axe-core", "lighthouse", "custom-analyzers"],
        "viewport": {
            "width": 1920,
            "height": 1080
        }
    }'::jsonb,
    'completed'
),
(
    analysis2_id,
    sample_user_id,
    project2_id,
    'https://portfolio-client.example.com',
    'detailed',
    'en',
    72,
    65,
    88,
    95,
    '{
        "summary": {
            "totalIssues": 18,
            "criticalIssues": 5,
            "seriousIssues": 7,
            "moderateIssues": 4,
            "minorIssues": 2
        },
        "categories": {
            "images": {
                "score": 45,
                "issueCount": 8,
                "description": "Significant image accessibility issues"
            },
            "forms": {
                "score": 60,
                "issueCount": 4,
                "description": "Forms need accessibility improvements"
            },
            "navigation": {
                "score": 80,
                "issueCount": 2,
                "description": "Navigation mostly accessible"
            },
            "colorContrast": {
                "score": 55,
                "issueCount": 6,
                "description": "Multiple color contrast failures"
            },
            "headingStructure": {
                "score": 75,
                "issueCount": 3,
                "description": "Heading structure needs work"
            },
            "keyboard": {
                "score": 70,
                "issueCount": 4,
                "description": "Some keyboard navigation issues"
            }
        },
        "recommendations": [
            "Comprehensive alt text audit needed",
            "Major color contrast improvements required",
            "Complete form accessibility overhaul",
            "Fix heading structure hierarchy",
            "Implement proper keyboard navigation"
        ]
    }'::jsonb,
    '{
        "analysisTime": "2024-01-16T14:15:00Z",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "pageLoadTime": 890,
        "totalElements": 203,
        "analysisVersion": "3.0",
        "tools": ["axe-core", "lighthouse", "custom-analyzers"],
        "viewport": {
            "width": 1440,
            "height": 900
        }
    }'::jsonb,
    'completed'
);

-- =====================================================
-- 5. SAMPLE SCREENSHOTS
-- =====================================================

INSERT INTO public.analysis_screenshots (id, analysis_id, screenshot_url, screenshot_type, storage_object_id, metadata) VALUES
(
    screenshot1_id,
    analysis1_id,
    'https://your-supabase-project.supabase.co/storage/v1/object/public/analysis-screenshots/screenshots/2024/01/example-com-main.png',
    'main',
    storage1_id,
    '{
        "dimensions": {
            "width": 1920,
            "height": 1080
        },
        "captureTime": "2024-01-15T10:30:15Z",
        "pageTitle": "Example.com - Home",
        "fileSize": 1024768,
        "format": "PNG"
    }'::jsonb
);

-- =====================================================
-- 6. SAMPLE VIOLATIONS (Large JSONB data)
-- =====================================================

INSERT INTO public.analysis_violations (analysis_id, violations) VALUES
(
    analysis1_id,
    '{
        "violations": [
            {
                "id": "image-alt",
                "impact": "serious",
                "tags": ["wcag2a", "wcag111", "section508"],
                "description": "Images must have alternate text",
                "help": "Images must have alternate text",
                "helpUrl": "https://dequeuniversity.com/rules/axe/4.4/image-alt",
                "nodes": [
                    {
                        "any": [],
                        "all": [],
                        "none": [
                            {
                                "id": "has-alt",
                                "data": null,
                                "relatedNodes": [],
                                "impact": "serious",
                                "message": "Element does not have an alt attribute"
                            }
                        ],
                        "impact": "serious",
                        "html": "<img src=\"hero-image.jpg\" class=\"hero-banner\">",
                        "target": [".hero-banner"],
                        "failureSummary": "Fix any of the following: Element does not have an alt attribute"
                    }
                ]
            },
            {
                "id": "color-contrast",
                "impact": "serious",
                "tags": ["wcag2aa", "wcag143"],
                "description": "Elements must have sufficient color contrast",
                "help": "Elements must have sufficient color contrast",
                "helpUrl": "https://dequeuniversity.com/rules/axe/4.4/color-contrast",
                "nodes": [
                    {
                        "any": [
                            {
                                "id": "color-contrast",
                                "data": {
                                    "fgColor": "#666666",
                                    "bgColor": "#ffffff",
                                    "contrastRatio": 3.2,
                                    "fontSize": "12.0pt (16px)",
                                    "fontWeight": "normal"
                                },
                                "relatedNodes": [],
                                "impact": "serious",
                                "message": "Element has insufficient color contrast of 3.2:1 (foreground color: #666666, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1"
                            }
                        ],
                        "all": [],
                        "none": [],
                        "impact": "serious",
                        "html": "<p class=\"secondary-text\">This is secondary text content.</p>",
                        "target": [".secondary-text"],
                        "failureSummary": "Fix any of the following: Element has insufficient color contrast"
                    }
                ]
            }
        ],
        "passes": [
            {
                "id": "document-title",
                "impact": null,
                "tags": ["wcag2a", "wcag242"],
                "description": "Documents must have <title> element to aid in navigation",
                "help": "Documents must have <title> element to aid in navigation",
                "helpUrl": "https://dequeuniversity.com/rules/axe/4.4/document-title",
                "nodes": [
                    {
                        "any": [
                            {
                                "id": "doc-has-title",
                                "data": null,
                                "relatedNodes": [],
                                "impact": "serious",
                                "message": "Document has a non-empty <title> element"
                            }
                        ],
                        "all": [],
                        "none": [],
                        "impact": null,
                        "html": "<title>Example.com - Home</title>",
                        "target": ["title"],
                        "failureSummary": null
                    }
                ]
            }
        ]
    }'::jsonb
);

-- =====================================================
-- 7. SAMPLE ANALYSIS SUMMARIES
-- =====================================================

INSERT INTO public.analysis_summaries (
    analysis_id,
    total_issues,
    critical_issues,
    serious_issues,
    moderate_issues,
    minor_issues,
    contrast_errors,
    missing_alt_text,
    form_issues,
    aria_issues,
    keyboard_issues,
    heading_issues,
    landmark_issues,
    wcag_level,
    compliance_percentage
) VALUES 
(
    analysis1_id,
    12, 2, 4, 5, 1,
    3, 4, 2, 1, 2, 1, 0,
    'AA',
    78.00
),
(
    analysis2_id,
    18, 5, 7, 4, 2,
    6, 8, 4, 3, 4, 3, 1,
    'A',
    65.00
);

-- =====================================================
-- 8. SAMPLE USAGE LOGS
-- =====================================================

INSERT INTO public.usage_logs (user_id, action, resource_type, resource_id, metadata) VALUES
(
    sample_user_id,
    'analysis_started',
    'analysis',
    analysis1_id,
    '{
        "url": "https://example.com",
        "reportType": "overview",
        "timestamp": "2024-01-15T10:30:00Z"
    }'::jsonb
),
(
    sample_user_id,
    'analysis_completed',
    'analysis', 
    analysis1_id,
    '{
        "url": "https://example.com",
        "duration": 15000,
        "overallScore": 85,
        "issuesFound": 12
    }'::jsonb
),
(
    sample_user_id,
    'project_created',
    'project',
    project1_id,
    '{
        "projectName": "Main Company Website",
        "websiteUrl": "https://example.com"
    }'::jsonb
),
(
    sample_user_id,
    'report_exported',
    'analysis',
    analysis1_id,
    '{
        "format": "pdf",
        "fileSize": 2048576,
        "pages": 15
    }'::jsonb
),
(
    sample_user_id,
    'dashboard_viewed',
    'dashboard',
    null,
    '{
        "viewType": "overview",
        "analyticsCount": 2,
        "projectsCount": 2
    }'::jsonb
);

-- =====================================================
-- SUCCESS MESSAGE AND VERIFICATION
-- =====================================================

RAISE NOTICE '🎉 Sample data inserted successfully!';
RAISE NOTICE '';
RAISE NOTICE '📊 Data Summary:';
RAISE NOTICE '   • User Profile: % (Demo Company Ltd)', sample_user_id;
RAISE NOTICE '   • Projects: 2 (Main Website + Client Portfolio)';
RAISE NOTICE '   • Analyses: 2 (Scores: 85%%, 72%%)';
RAISE NOTICE '   • Screenshots: 1 sample screenshot';
RAISE NOTICE '   • Usage Logs: 5 sample activities';
RAISE NOTICE '';
RAISE NOTICE '🔍 Next Steps:';
RAISE NOTICE '   1. Test the dashboard to see sample data';
RAISE NOTICE '   2. Run a real analysis to generate new data';
RAISE NOTICE '   3. Check screenshot storage is working';
RAISE NOTICE '   4. Clear sample data when ready: DELETE FROM analyses WHERE id IN (''%'', ''%'');', analysis1_id, analysis2_id;

END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Quick verification of inserted data
SELECT 
    '📋 Data Verification' as section,
    (SELECT COUNT(*) FROM public.user_profiles WHERE company = 'Demo Company Ltd') as demo_users,
    (SELECT COUNT(*) FROM public.projects WHERE name LIKE '%Company Website%' OR name LIKE '%Portfolio%') as sample_projects,
    (SELECT COUNT(*) FROM public.analyses WHERE url LIKE '%example.com%') as sample_analyses,
    (SELECT COUNT(*) FROM public.analysis_screenshots) as sample_screenshots,
    (SELECT COUNT(*) FROM public.analysis_summaries WHERE total_issues > 0) as sample_summaries,
    (SELECT COUNT(*) FROM public.usage_logs WHERE action LIKE '%analysis%' OR action LIKE '%project%') as sample_logs;

-- Show sample analysis scores
SELECT 
    '🎯 Sample Analysis Scores' as section,
    a.url,
    a.overall_score,
    a.accessibility_score,
    a.seo_score,
    a.performance_score,
    s.total_issues,
    s.compliance_percentage
FROM public.analyses a
JOIN public.analysis_summaries s ON a.id = s.analysis_id
WHERE a.url LIKE '%example.com%'
ORDER BY a.created_at DESC;