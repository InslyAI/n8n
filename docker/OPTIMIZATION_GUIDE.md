# Docker Build Optimization Guide

## Overview

This guide explains the optimizations made to the Docker build process, particularly for UI-only changes.

## Key Optimizations

### 1. Smart Path Filtering

The workflow now detects whether changes are UI-only or require a full rebuild:

- **UI-only changes**: `packages/frontend/**`, `packages/editor-ui/**`, etc.
- **Backend changes**: `packages/cli/**`, `packages/core/**`, etc.

### 2. Build Type Detection

Three build types are supported:
- `ui-only`: For frontend-only changes (fastest)
- `full`: For backend or mixed changes
- `auto`: Automatically detects based on changed files

### 3. Optimized Build Jobs

#### UI-Only Build (~3-4 minutes)
- Builds only frontend packages
- Uses AMD64 platform only for speed
- Reuses cached backend from latest image
- Skips unnecessary backend compilation

#### Full Build (~10-15 minutes)
- Builds entire application
- Supports multi-architecture (AMD64 + ARM64)
- Uses comprehensive caching

### 4. Enhanced Caching Strategy

Multiple cache layers:
1. **GitHub Actions cache**: For build artifacts
2. **Registry cache**: For Docker layers
3. **pnpm store cache**: For node_modules
4. **Turborepo cache**: For incremental builds

### 5. Platform Optimization

- PRs use AMD64 only (faster feedback)
- Releases use multi-arch (AMD64 + ARM64)
- UI builds skip ARM64 entirely

## Usage

### Manual Trigger with Build Type

```bash
# Trigger UI-only build
gh workflow run docker-build-ghcr-optimized.yml -f build_type=ui-only

# Force full build
gh workflow run docker-build-ghcr-optimized.yml -f build_type=full
```

### Automatic Detection

The workflow automatically detects the build type based on changed files:
- Frontend changes only → UI-only build
- Backend changes → Full build
- Mixed changes → Full build

## Performance Comparison

| Build Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| UI-only    | 15 min | 3-4 min | ~75% faster |
| Full build | 15 min | 10-12 min | ~25% faster |
| PR builds  | 15 min | 5-7 min | ~60% faster |

## Cache Management

### Cache Keys
- UI builds: `build-cache-{sha}-ui-only`
- Full builds: `build-cache-{sha}-full`

### Cache Invalidation
Caches are automatically invalidated when:
- Dependencies change (pnpm-lock.yaml)
- Docker base image updates
- Build configuration changes

## Troubleshooting

### Force Cache Refresh
Add `[skip-cache]` to commit message to bypass caches.

### Build Type Override
Use workflow dispatch with explicit `build_type` parameter.

### Debug Mode
Set `ACTIONS_STEP_DEBUG=true` in repository secrets for verbose output.

## Future Improvements

1. **Incremental UI builds**: Only rebuild changed UI packages
2. **Distributed builds**: Parallel package builds across runners
3. **Pre-built base images**: Monthly base image updates
4. **Build matrix**: Different Node versions for testing