#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
REGISTRY="ghcr.io"
IMAGE_NAME="inslyai/n8n"
BUILD_TYPE="auto"
PLATFORM="linux/amd64"
PUSH=false
NO_CACHE=false

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to detect changes
detect_changes() {
    print_info "Detecting changes..."
    
    UI_CHANGED=false
    BACKEND_CHANGED=false
    
    # Check for UI changes
    if git diff --name-only HEAD~1..HEAD | grep -qE "(packages/editor-ui|packages/@n8n/chat|packages/@n8n/design-system|packages/frontend)"; then
        UI_CHANGED=true
    fi
    
    # Check for backend changes
    if git diff --name-only HEAD~1..HEAD | grep -qE "(packages/cli|packages/core|packages/workflow|packages/nodes-base|packages/@n8n/api-types|packages/@n8n/config|packages/@n8n/db)"; then
        BACKEND_CHANGED=true
    fi
    
    # Determine build type
    if [ "$BUILD_TYPE" = "auto" ]; then
        if [ "$UI_CHANGED" = true ] && [ "$BACKEND_CHANGED" = false ]; then
            BUILD_TYPE="ui-only"
        elif [ "$BACKEND_CHANGED" = true ] && [ "$UI_CHANGED" = false ]; then
            BUILD_TYPE="backend-only"
        else
            BUILD_TYPE="full"
        fi
    fi
    
    print_info "UI Changed: $UI_CHANGED"
    print_info "Backend Changed: $BACKEND_CHANGED"
    print_info "Build Type: $BUILD_TYPE"
}

# Function to setup BuildKit
setup_buildkit() {
    print_info "Setting up Docker BuildKit..."
    export DOCKER_BUILDKIT=1
    export BUILDKIT_PROGRESS=plain
    
    # Create builder if it doesn't exist
    if ! docker buildx ls | grep -q "n8n-builder"; then
        print_info "Creating BuildKit builder..."
        docker buildx create --name n8n-builder --driver docker-container --use
        docker buildx inspect --bootstrap
    else
        docker buildx use n8n-builder
    fi
}

# Function to build UI only
build_ui_only() {
    print_info "Building UI only..."
    
    # Check if base image exists
    BASE_IMAGE="${REGISTRY}/${IMAGE_NAME}:latest"
    if ! docker manifest inspect "$BASE_IMAGE" > /dev/null 2>&1; then
        print_error "Base image $BASE_IMAGE not found. Building full image instead."
        BUILD_TYPE="full"
        build_full
        return
    fi
    
    # Build UI
    pnpm install --frozen-lockfile \
        --filter "@n8n/design-system" \
        --filter "@n8n/chat" \
        --filter "n8n-editor-ui"
    
    pnpm --filter @n8n/design-system build
    pnpm --filter @n8n/chat build
    pnpm --filter n8n-editor-ui build
    
    # Build Docker image
    docker buildx build \
        --platform="$PLATFORM" \
        --file docker/images/n8n/Dockerfile.ui-optimized \
        --build-arg BASE_IMAGE="$BASE_IMAGE" \
        --tag "${REGISTRY}/${IMAGE_NAME}:ui-latest" \
        ${NO_CACHE:+--no-cache} \
        ${PUSH:+--push} \
        .
}

# Function to build backend only
build_backend_only() {
    print_info "Building backend only..."
    
    pnpm install --frozen-lockfile
    pnpm build:backend
    
    build_full
}

# Function to build full application
build_full() {
    print_info "Building full application..."
    
    # Install all dependencies
    pnpm install --frozen-lockfile
    
    # Build everything
    pnpm build
    
    # Build Docker image with BuildKit
    docker buildx build \
        --platform="$PLATFORM" \
        --file docker/images/n8n/Dockerfile.buildkit \
        --build-arg NODE_VERSION=22 \
        --build-arg N8N_VERSION="$(git rev-parse HEAD)" \
        --tag "${REGISTRY}/${IMAGE_NAME}:latest" \
        --cache-from "type=registry,ref=${REGISTRY}/${IMAGE_NAME}:buildcache" \
        --cache-to "type=registry,ref=${REGISTRY}/${IMAGE_NAME}:buildcache,mode=max" \
        ${NO_CACHE:+--no-cache} \
        ${PUSH:+--push} \
        .
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --type TYPE        Build type: auto, ui-only, backend-only, full (default: auto)"
            echo "  --platform PLATFORM Platform to build for (default: linux/amd64)"
            echo "  --push             Push image to registry after build"
            echo "  --no-cache         Build without cache"
            echo "  --registry REGISTRY Docker registry (default: ghcr.io)"
            echo "  --image NAME       Image name (default: inslyai/n8n)"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main execution
print_info "Starting optimized Docker build..."

# Check prerequisites
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed"
    exit 1
fi

# Setup environment
setup_buildkit

# Detect changes and determine build type
detect_changes

# Start timing
START_TIME=$(date +%s)

# Execute appropriate build
case $BUILD_TYPE in
    ui-only)
        build_ui_only
        ;;
    backend-only)
        build_backend_only
        ;;
    full)
        build_full
        ;;
    *)
        print_error "Unknown build type: $BUILD_TYPE"
        exit 1
        ;;
esac

# Calculate build time
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
MINUTES=$((BUILD_TIME / 60))
SECONDS=$((BUILD_TIME % 60))

print_info "Build completed in ${MINUTES}m ${SECONDS}s"
print_info "Build type: $BUILD_TYPE"
print_info "Image: ${REGISTRY}/${IMAGE_NAME}:latest"