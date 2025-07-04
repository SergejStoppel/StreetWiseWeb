# Ticket Completion Guide - SiteCraft Development

## How to Complete a Ticket

### 1. Check Dependencies
Before starting any ticket, verify all dependencies are completed:
- Review the "Dependencies" field in the epic documents
- Ensure all prerequisite tickets show "Status: Completed ✅"
- Coordinate with team if dependencies are not met

### 2. Update Status to In Progress
```markdown
**Status**: In Progress 🚧
**Assigned To**: [Your Name]
**Start Date**: [Current Date]
```

### 3. Implementation
Follow the detailed instructions in each ticket:
- Read acceptance criteria carefully
- Implement according to best practices
- Test thoroughly during development
- Handle error cases properly

### 4. Testing Checklist
**Backend:**
- [ ] API endpoints work correctly
- [ ] Input validation functions properly
- [ ] Error handling covers edge cases
- [ ] Database operations succeed
- [ ] Authentication/authorization works

**Frontend:**
- [ ] Component renders without errors
- [ ] User interactions work correctly
- [ ] Form validation provides feedback
- [ ] Loading states display properly
- [ ] Responsive design works on all screens

### 5. Mark as Complete
Update the ticket with completion information:

```markdown
**Status**: Completed ✅
**Completed By**: [Your Name]
**Completion Date**: [Current Date]
**Notes**: [Brief implementation notes]

**Files Created/Modified**:
- [List of files]

**Testing Completed**:
- [x] Manual testing completed
- [x] Error cases verified
- [x] Cross-browser testing (frontend)
```

## Code Quality Standards

### TypeScript Guidelines
- Use strict type checking
- Define interfaces for all data structures
- Avoid `any` type usage
- Use proper return types

### React/Next.js Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns
- Use Zustand for state management

### Node.js/Express Guidelines
- Use async/await for async operations
- Implement proper error handling
- Use Prisma for database operations
- Follow REST API conventions

## Getting Help

Ask for help when:
- Blocked by technical issues for more than 2 hours
- Unclear about requirements
- Need architecture clarification
- Encountering security/performance concerns

When asking for help:
1. Document the specific issue
2. List steps already attempted
3. Provide relevant code snippets
4. Include error messages
5. Suggest potential solutions

## Dependencies Reference

### Backend Dependencies
- BE-001 (Setup) → BE-002 (Auth) → BE-003 (Audit) → BE-004 (Content)
- BE-005 (Reports) depends on BE-003 and BE-004

### Frontend Dependencies
- FE-001 (Setup) → FE-002 (Landing) → FE-003 (Auth) → FE-004 (Dashboard)
- FE-005 (Content) depends on FE-004
- FE-006 (Reports) depends on FE-004

### Cross-Platform Dependencies
- Frontend auth depends on Backend auth (BE-002)
- Frontend audit features depend on Backend audit (BE-003)
- Frontend content generation depends on Backend content (BE-004)
- Frontend reports depend on Backend reports (BE-005) 