#!/bin/bash

# CoachFlow Health Check Script
# Comprehensive health monitoring for production environments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
BASE_URL="http://localhost:3000"
TIMEOUT=30
RETRIES=3
VERBOSE=false
OUTPUT_FORMAT="text"
CHECK_EXTERNAL=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log() {
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        return
    fi
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        return
    fi
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $1${NC}"
}

error() {
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        return
    fi
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

debug() {
    if [[ "$VERBOSE" == true && "$OUTPUT_FORMAT" != "json" ]]; then
        echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] DEBUG: $1${NC}"
    fi
}

# Usage
usage() {
    cat << EOF
CoachFlow Health Check Script

Usage: $0 [OPTIONS]

OPTIONS:
    -u, --url URL           Base URL to check [default: http://localhost:3000]
    -t, --timeout SEC       Request timeout in seconds [default: 30]
    -r, --retries NUM       Number of retries for failed checks [default: 3]
    -v, --verbose           Enable verbose logging
    -f, --format FORMAT     Output format (text|json) [default: text]
    -e, --external          Include external service checks
    -h, --help              Show this help message

EXAMPLES:
    $0                                      # Basic health check
    $0 --url https://coachflow.com         # Check production
    $0 --format json --external            # JSON output with external checks
    $0 --verbose --retries 5               # Verbose with 5 retries

EXIT CODES:
    0    All checks passed
    1    Some checks failed
    2    Critical failure (service unavailable)

EOF
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                BASE_URL="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -r|--retries)
                RETRIES="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -f|--format)
                OUTPUT_FORMAT="$2"
                shift 2
                ;;
            -e|--external)
                CHECK_EXTERNAL=true
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
}

# Initialize results
declare -A RESULTS
OVERALL_STATUS="healthy"
START_TIME=$(date +%s)

# HTTP check helper
http_check() {
    local url="$1"
    local expected_status="${2:-200}"
    local description="$3"
    
    debug "Checking $url (expecting $expected_status)"
    
    local response
    local status_code
    local response_time
    
    for ((i=1; i<=RETRIES; i++)); do
        local start_time=$(date +%s%N)
        
        response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
                       --max-time "$TIMEOUT" \
                       --connect-timeout 10 \
                       "$url" 2>/dev/null || echo "HTTPSTATUS:000;TIME:0")
        
        status_code=$(echo "$response" | tr ';' '\n' | grep "HTTPSTATUS" | cut -d: -f2)
        response_time=$(echo "$response" | tr ';' '\n' | grep "TIME" | cut -d: -f2)
        
        if [[ "$status_code" == "$expected_status" ]]; then
            RESULTS["$description"]="✅ OK (${response_time}s, attempt $i/$RETRIES)"
            return 0
        fi
        
        warn "Attempt $i/$RETRIES failed for $description: HTTP $status_code"
        sleep 2
    done
    
    RESULTS["$description"]="❌ FAILED (HTTP $status_code after $RETRIES attempts)"
    OVERALL_STATUS="unhealthy"
    return 1
}

# JSON response check
json_check() {
    local url="$1"
    local key="$2"
    local expected_value="$3"
    local description="$4"
    
    debug "Checking JSON response at $url for $key=$expected_value"
    
    for ((i=1; i<=RETRIES; i++)); do
        local response=$(curl -s --max-time "$TIMEOUT" "$url" 2>/dev/null || echo '{}')
        local actual_value
        
        if command -v jq >/dev/null 2>&1; then
            actual_value=$(echo "$response" | jq -r ".$key" 2>/dev/null || echo "null")
        else
            # Fallback parsing for basic cases
            actual_value=$(echo "$response" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4)
        fi
        
        if [[ "$actual_value" == "$expected_value" ]]; then
            RESULTS["$description"]="✅ OK ($key=$actual_value, attempt $i/$RETRIES)"
            return 0
        fi
        
        warn "Attempt $i/$RETRIES failed for $description: $key=$actual_value (expected $expected_value)"
        sleep 2
    done
    
    RESULTS["$description"]="❌ FAILED ($key=$actual_value, expected $expected_value)"
    OVERALL_STATUS="unhealthy"
    return 1
}

# Port check
port_check() {
    local host="$1"
    local port="$2"
    local description="$3"
    
    debug "Checking port $port on $host"
    
    if timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        RESULTS["$description"]="✅ OK (port $port open)"
        return 0
    else
        RESULTS["$description"]="❌ FAILED (port $port closed or unreachable)"
        OVERALL_STATUS="unhealthy"
        return 1
    fi
}

# Core application checks
check_application() {
    log "Checking core application health..."
    
    # Basic connectivity
    http_check "$BASE_URL" 200 "Application Response"
    
    # Health endpoint
    json_check "$BASE_URL/api/health" "overall" "healthy" "Health Endpoint"
    
    # API endpoints (basic smoke tests)
    http_check "$BASE_URL/api/health" 200 "Health API"
}

# Database checks
check_database() {
    log "Checking database connectivity..."
    
    # Check database status via health endpoint
    local db_url="$BASE_URL/api/health"
    local response=$(curl -s --max-time "$TIMEOUT" "$db_url" 2>/dev/null || echo '{}')
    
    if command -v jq >/dev/null 2>&1; then
        local db_status=$(echo "$response" | jq -r '.database // "unknown"' 2>/dev/null)
    else
        local db_status=$(echo "$response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [[ "$db_status" == "connected" ]]; then
        RESULTS["Database Connectivity"]="✅ OK (status: $db_status)"
    else
        RESULTS["Database Connectivity"]="❌ FAILED (status: $db_status)"
        OVERALL_STATUS="unhealthy"
    fi
}

# External services check
check_external_services() {
    if [[ "$CHECK_EXTERNAL" != true ]]; then
        return 0
    fi
    
    log "Checking external services..."
    
    # OpenAI API
    if [[ -n "${OPENAI_API_KEY:-}" ]]; then
        http_check "https://api.openai.com/v1/models" 200 "OpenAI API"
    fi
    
    # Supabase
    if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
        http_check "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" 200 "Supabase API"
    fi
    
    # Redis (if configured)
    if [[ -n "${REDIS_URL:-}" ]]; then
        # Extract host and port from Redis URL
        local redis_host=$(echo "$REDIS_URL" | sed 's|redis://||' | cut -d: -f1)
        local redis_port=$(echo "$REDIS_URL" | sed 's|redis://||' | cut -d: -f2 | cut -d/ -f1)
        port_check "$redis_host" "${redis_port:-6379}" "Redis Connectivity"
    fi
}

# Performance checks
check_performance() {
    log "Checking application performance..."
    
    local start_time=$(date +%s%N)
    local response=$(curl -s -w "TIME:%{time_total}" --max-time "$TIMEOUT" "$BASE_URL" 2>/dev/null || echo "TIME:999")
    local response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    local end_time=$(date +%s%N)
    
    # Convert to milliseconds
    local response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time_ms < 2000" | bc -l 2>/dev/null || echo 0) )); then
        RESULTS["Response Time"]="✅ OK (${response_time_ms}ms)"
    elif (( $(echo "$response_time_ms < 5000" | bc -l 2>/dev/null || echo 0) )); then
        RESULTS["Response Time"]="⚠️ SLOW (${response_time_ms}ms)"
        if [[ "$OVERALL_STATUS" == "healthy" ]]; then
            OVERALL_STATUS="degraded"
        fi
    else
        RESULTS["Response Time"]="❌ FAILED (${response_time_ms}ms - too slow)"
        OVERALL_STATUS="unhealthy"
    fi
}

# Security checks
check_security() {
    log "Checking security headers..."
    
    local headers=$(curl -I -s --max-time "$TIMEOUT" "$BASE_URL" 2>/dev/null || echo "")
    
    # Check for important security headers
    local security_headers=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "Strict-Transport-Security"
        "Referrer-Policy"
    )
    
    local missing_headers=()
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -i "$header" >/dev/null; then
            RESULTS["Security Header: $header"]="✅ OK"
        else
            RESULTS["Security Header: $header"]="❌ MISSING"
            missing_headers+=("$header")
        fi
    done
    
    if [[ ${#missing_headers[@]} -gt 0 ]]; then
        warn "Missing security headers: ${missing_headers[*]}"
        if [[ "$OVERALL_STATUS" == "healthy" ]]; then
            OVERALL_STATUS="degraded"
        fi
    fi
}

# Output results
output_results() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        # JSON output
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"overall_status\": \"$OVERALL_STATUS\","
        echo "  \"duration_seconds\": $duration,"
        echo "  \"base_url\": \"$BASE_URL\","
        echo "  \"checks\": {"
        
        local first=true
        for check in "${!RESULTS[@]}"; do
            if [[ "$first" == true ]]; then
                first=false
            else
                echo ","
            fi
            
            local status="failed"
            if [[ "${RESULTS[$check]}" == ✅* ]]; then
                status="passed"
            elif [[ "${RESULTS[$check]}" == ⚠️* ]]; then
                status="warning"
            fi
            
            printf "    \"%s\": { \"status\": \"%s\", \"message\": \"%s\" }" \
                   "$check" "$status" "${RESULTS[$check]}"
        done
        echo ""
        echo "  }"
        echo "}"
    else
        # Text output
        echo ""
        echo "============================================="
        echo "  CoachFlow Health Check Report"
        echo "============================================="
        echo "Overall Status: $OVERALL_STATUS"
        echo "Check Duration: ${duration}s"
        echo "Base URL: $BASE_URL"
        echo "Timestamp: $(date)"
        echo "============================================="
        echo ""
        
        for check in "${!RESULTS[@]}"; do
            printf "%-30s %s\n" "$check:" "${RESULTS[$check]}"
        done
        
        echo ""
        echo "============================================="
        
        case $OVERALL_STATUS in
            "healthy")
                echo -e "${GREEN}✅ All checks passed!${NC}"
                ;;
            "degraded")
                echo -e "${YELLOW}⚠️ Some issues detected but service is operational${NC}"
                ;;
            "unhealthy")
                echo -e "${RED}❌ Critical issues detected${NC}"
                ;;
        esac
    fi
}

# Main function
main() {
    parse_args "$@"
    
    debug "Starting health check for $BASE_URL"
    debug "Configuration: timeout=${TIMEOUT}s, retries=$RETRIES, format=$OUTPUT_FORMAT"
    
    # Run checks
    check_application
    check_database
    check_external_services
    check_performance
    check_security
    
    # Output results
    output_results
    
    # Exit with appropriate code
    case $OVERALL_STATUS in
        "healthy") exit 0 ;;
        "degraded") exit 1 ;;
        "unhealthy") exit 2 ;;
    esac
}

# Run main function
main "$@"