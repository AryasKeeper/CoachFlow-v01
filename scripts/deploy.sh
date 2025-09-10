#!/bin/bash

# CoachFlow Deployment Script
# Handles deployment to different environments with proper validation

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
VERBOSE=false

# Helper functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE" >&2
}

debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] DEBUG: $1${NC}" | tee -a "$LOG_FILE"
    fi
}

# Usage information
usage() {
    cat << EOF
CoachFlow Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -s, --skip-tests        Skip running tests
    -b, --skip-build        Skip building the application
    -d, --dry-run           Show what would be done without executing
    -v, --verbose           Enable verbose logging
    -h, --help              Show this help message

EXAMPLES:
    $0 --environment staging
    $0 --environment production --skip-tests
    $0 --dry-run --verbose

ENVIRONMENT VARIABLES:
    DOCKER_REGISTRY         Docker registry URL
    IMAGE_TAG              Docker image tag [default: latest]
    DEPLOYMENT_TIMEOUT     Deployment timeout in seconds [default: 300]
    HEALTH_CHECK_RETRIES   Health check retry count [default: 10]

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -b|--skip-build)
                SKIP_BUILD=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # Validate environment
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
        exit 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."

    # Check if required tools are available
    command -v docker >/dev/null 2>&1 || { error "Docker is required but not installed."; exit 1; }
    command -v npm >/dev/null 2>&1 || { error "npm is required but not installed."; exit 1; }
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
        exit 1
    fi

    # Check for uncommitted changes in production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if ! git diff --quiet; then
            error "Uncommitted changes found. Please commit or stash changes before production deployment."
            exit 1
        fi
    fi

    # Verify environment configuration
    local env_file="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
    if [[ ! -f "$env_file" ]]; then
        warn "Environment file not found: $env_file"
        log "Using environment variables from system"
    fi

    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running"
        exit 1
    fi

    log "Pre-deployment checks completed ✓"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        warn "Skipping tests as requested"
        return 0
    fi

    log "Running test suite..."
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Would run: npm run test:ci"
        return 0
    fi

    cd "$PROJECT_ROOT"
    
    # Type checking
    log "Running TypeScript type check..."
    npm run type-check

    # Linting
    log "Running ESLint..."
    npm run lint

    # Unit tests
    log "Running unit tests..."
    npm run test:coverage

    # Integration tests
    log "Running integration tests..."
    # Add specific integration test command if different

    log "All tests passed ✓"
}

# Build application
build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        warn "Skipping build as requested"
        return 0
    fi

    log "Building application for $ENVIRONMENT..."
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Would run: npm run build:prod"
        log "[DRY-RUN] Would build Docker image"
        return 0
    fi

    cd "$PROJECT_ROOT"

    # Build the application
    NODE_ENV="production" npm run build:prod

    # Build Docker image
    local image_tag="${IMAGE_TAG:-latest}"
    local registry="${DOCKER_REGISTRY:-}"
    
    if [[ -n "$registry" ]]; then
        local full_image_name="${registry}/coachflow:${image_tag}"
    else
        local full_image_name="coachflow:${image_tag}"
    fi

    log "Building Docker image: $full_image_name"
    docker build -t "$full_image_name" .

    # Push to registry if configured
    if [[ -n "$registry" ]]; then
        log "Pushing image to registry..."
        docker push "$full_image_name"
    fi

    log "Build completed ✓"
}

# Deploy application
deploy_application() {
    log "Deploying to $ENVIRONMENT environment..."
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Would deploy to $ENVIRONMENT"
        log "[DRY-RUN] Would update container orchestration"
        log "[DRY-RUN] Would run health checks"
        return 0
    fi

    cd "$PROJECT_ROOT"

    case $ENVIRONMENT in
        staging)
            deploy_to_staging
            ;;
        production)
            deploy_to_production
            ;;
    esac

    log "Deployment completed ✓"
}

# Staging deployment
deploy_to_staging() {
    log "Deploying to staging environment..."
    
    # Use Docker Compose for staging
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d --force-recreate

    # Wait for services to be ready
    wait_for_health_check "http://localhost:3000"
}

# Production deployment
deploy_to_production() {
    log "Deploying to production environment..."
    
    # Production deployment strategy (blue-green, rolling, etc.)
    # This is a placeholder - implement your specific deployment strategy
    
    # Example: Docker Compose with production override
    docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d --force-recreate

    # Wait for services to be ready
    wait_for_health_check "https://coachflow.com"
}

# Health check function
wait_for_health_check() {
    local url="$1"
    local retries="${HEALTH_CHECK_RETRIES:-10}"
    local timeout="${DEPLOYMENT_TIMEOUT:-300}"
    local wait_time=5
    
    log "Waiting for application to be healthy at $url..."
    
    for ((i=1; i<=retries; i++)); do
        if curl -f -s --max-time 10 "$url/api/health" >/dev/null; then
            log "Health check passed ✓"
            return 0
        fi
        
        warn "Health check attempt $i/$retries failed, waiting ${wait_time}s..."
        sleep $wait_time
        
        # Increase wait time for subsequent attempts
        wait_time=$((wait_time + 2))
    done
    
    error "Health check failed after $retries attempts"
    return 1
}

# Post-deployment tasks
post_deployment_tasks() {
    log "Running post-deployment tasks..."
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Would run post-deployment tasks"
        return 0
    fi

    # Clear CDN cache if applicable
    # clear_cdn_cache

    # Update monitoring dashboards
    # update_monitoring_dashboards

    # Send notifications
    send_deployment_notification

    log "Post-deployment tasks completed ✓"
}

# Send deployment notification
send_deployment_notification() {
    local webhook_url="${SLACK_WEBHOOK_URL:-}"
    
    if [[ -n "$webhook_url" ]]; then
        local message="🚀 CoachFlow deployed to $ENVIRONMENT successfully"
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$webhook_url" >/dev/null 2>&1 || warn "Failed to send Slack notification"
    fi
}

# Error handling
cleanup_on_error() {
    error "Deployment failed. Running cleanup..."
    
    # Stop any containers that might be in a bad state
    docker-compose down >/dev/null 2>&1 || true
    
    # Additional cleanup tasks
    # rollback_deployment
    
    error "Cleanup completed. Check logs for details: $LOG_FILE"
}

# Main deployment flow
main() {
    # Create logs directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    log "Starting CoachFlow deployment to $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    
    if [ "$DRY_RUN" = true ]; then
        warn "DRY RUN MODE - No changes will be made"
    fi
    
    # Parse arguments
    parse_args "$@"
    
    # Run deployment steps
    pre_deployment_checks
    run_tests
    build_application
    deploy_application
    post_deployment_tasks
    
    log "Deployment to $ENVIRONMENT completed successfully! 🎉"
    
    # Print summary
    echo ""
    echo "==================================="
    echo "  Deployment Summary"
    echo "==================================="
    echo "Environment: $ENVIRONMENT"
    echo "Build skipped: $SKIP_BUILD"
    echo "Tests skipped: $SKIP_TESTS"
    echo "Dry run: $DRY_RUN"
    echo "Log file: $LOG_FILE"
    echo "==================================="
}

# Run main function with all arguments
main "$@"