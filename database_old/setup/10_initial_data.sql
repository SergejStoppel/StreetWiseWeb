-- =====================================================
-- 10. INITIAL DATA
-- =====================================================
-- Inserts initial configuration data
-- Must be run after all tables and policies are created
-- =====================================================

BEGIN;

-- Insert default report configurations
INSERT INTO public.report_configurations (report_type, included_features, max_issues_shown, includes_ai_insights, includes_code_snippets, includes_remediation_steps, includes_full_screenshots, includes_seo_analysis, watermark_enabled)
VALUES 
  ('free', 
   '{
     "accessibility": {
       "show_top_issues": true,
       "max_issues": 3,
       "show_summary_only": true,
       "show_wcag_references": false,
       "show_issue_count": true,
       "show_affected_elements": false
     },
     "seo": {
       "show_top_issue": true,
       "max_issues": 1,
       "show_basic_recommendation": true,
       "show_technical_details": false
     },
     "screenshots": {
       "show_main_only": true,
       "max_resolution": "thumbnail",
       "watermark": true
     },
     "cta": {
       "show_upgrade_prompts": true,
       "highlight_premium_features": true
     }
   }'::jsonb,
   3,
   false,
   false,
   false,
   false,
   false,
   true
  ),
  ('detailed',
   '{
     "accessibility": {
       "show_all_issues": true,
       "show_wcag_details": true,
       "show_affected_elements": true,
       "show_disability_impact": true,
       "show_code_snippets": true,
       "show_remediation_steps": true,
       "group_by_wcag_principle": true
     },
     "seo": {
       "show_all_recommendations": true,
       "show_technical_seo": true,
       "show_ai_suggestions": true,
       "show_competitor_insights": true,
       "show_priority_matrix": true
     },
     "screenshots": {
       "show_desktop_mobile": true,
       "show_full_page": true,
       "high_resolution": true,
       "annotated_issues": true
     },
     "ai_insights": {
       "enabled": true,
       "show_remediation_priority": true,
       "show_business_impact": true,
       "show_implementation_timeline": true
     },
     "export": {
       "pdf_enabled": true,
       "csv_enabled": true,
       "share_link_enabled": true
     }
   }'::jsonb,
   NULL, -- No limit for detailed reports
   true,
   true,
   true,
   true,
   true,
   false
  )
ON CONFLICT (report_type) DO UPDATE
SET 
  included_features = EXCLUDED.included_features,
  max_issues_shown = EXCLUDED.max_issues_shown,
  includes_ai_insights = EXCLUDED.includes_ai_insights,
  includes_code_snippets = EXCLUDED.includes_code_snippets,
  includes_remediation_steps = EXCLUDED.includes_remediation_steps,
  includes_full_screenshots = EXCLUDED.includes_full_screenshots,
  includes_seo_analysis = EXCLUDED.includes_seo_analysis,
  watermark_enabled = EXCLUDED.watermark_enabled,
  updated_at = NOW();

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Initial data inserted successfully';
    RAISE NOTICE '';
END $$;