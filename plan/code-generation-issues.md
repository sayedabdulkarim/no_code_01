# Code Generation Issues & Fix Plan

## Overview
The no-code framework is generating broken code that requires manual fixes. This defeats the purpose of a no-code solution. This document tracks all identified issues and the plan to fix them.

## Current Problems

### 1. Missing 'use client' Directives
**Issue**: Components using React hooks lack 'use client' directive
**Impact**: Build fails with "React Hook only works in a Client Component" error
**Root Cause**: 
- Generation prompt doesn't specify when to add 'use client'
- Build validator removes 'use client' when fixing other errors

### 2. Import/Export Pattern Inconsistencies
**Issue**: Mixed default and named exports causing import errors
**Examples**:
- `CounterButtons.tsx`: Uses `export default`
- `Counter.tsx`: Imports as `{ CounterButtons }` (named import)
- `formatArchiveDate` not exported from `dateUtils.ts`

**Root Cause**: No consistent export/import rules in generation prompts

### 3. Type Definition Conflicts
**Issue**: Multiple conflicting `Task` interfaces across files
**Examples**:
```typescript
// TodoApp.tsx
{ id: number, title: string, completed: boolean }

// Task.ts
{ id: string, title: string, isCompleted: boolean, ... }

// archiveUtils.ts
{ id: string, title: string, completed: boolean, createdAt: string }
```
**Root Cause**: No centralized type management strategy

### 4. Tailwind CSS Version Conflicts
**Issue**: Tailwind v4 installed but PostCSS config uses v3 syntax
**Impact**: "PostCSS plugin has moved to @tailwindcss/postcss" error
**Root Cause**: 
- Package.json template may specify v3
- Version detection happens after installation

### 5. Build Validation Loop
**Issue**: Error fixes create new errors
**Example Flow**:
1. Add 'use client' to fix hooks error
2. AI removes 'use client' when fixing type errors
3. Hooks error returns
4. Loop continues

**Root Cause**: Build validator doesn't preserve previous fixes

## Files Requiring Updates

### 1. `/backend_node/services/task-based-generator.js`
**Status**: Partially updated
**Still Needed**:
- Rules for when to add 'use client' directive
- Centralized type definition strategy
- Component integration patterns

### 2. `/backend_node/services/llm-build-validator.js`
**Status**: Not updated
**Needed**:
- Always preserve 'use client' directives
- Include same rules as generator
- Track previous fixes to avoid loops

### 3. `/backend_node/services/agent-service.js`
**Status**: Not checked
**Needed**:
- Update initial project generation
- Ensure Tailwind v4 compatibility
- Consistent patterns with task-based generator

### 4. Package generation templates
**Status**: Not identified
**Needed**:
- Update to Tailwind v4 by default
- Include @tailwindcss/postcss for v4

## Expected Behavior

### Success Criteria:
1. Generate project from user request
2. First `npm run build` succeeds without errors
3. `npm run dev` starts without errors
4. All features work as requested
5. No manual intervention required

### Validation Test Cases:
1. **Simple Counter App**: Should work on first generation
2. **Todo App with TypeScript**: Should have consistent types
3. **Multi-component App**: Should have correct imports/exports
4. **App with Hooks**: Should have 'use client' directives

## Implementation Plan

### Phase 1: Fix Generation Rules ✅
1. Updated task-based-generator.js with:
   - Export/import pattern rules
   - Component vs utility export patterns
   - Clear import matching rules

### Phase 2: Fix Build Validation ✅
1. Updated llm-build-validator.js to:
   - ALWAYS preserve 'use client' directives
   - Include same export/import rules as generator
   - Prevent removal of correct code

### Phase 3: Package.json Generation ✅
1. Discovered package.json comes from `create-next-app@latest`
2. System adapts to whatever Tailwind version is installed
3. PostCSS config generator handles v3 vs v4 automatically

### Phase 4: Testing ✅
1. Created local testing framework in `/backend_node/tests/`
2. All validation tests now passing
3. Ready for real project generation testing

## Local Testing Framework

Created two test files:
1. **code-generation-validator.js** - Validates generated code patterns
2. **generation-rules-tester.js** - Tests generation rules without LLM
3. **test-runner.js** - Comprehensive test suite

Run tests with: `node test-runner.js` in the tests directory

## Notes
- The system should generate working code on first attempt
- Error fixing should be a fallback, not the primary path
- All AI prompts must be consistent in their rules