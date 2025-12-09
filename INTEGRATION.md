# HotStack Integration Guide

## Overview

HotStack now integrates with **CodeNest** and **ToyNest** to provide a complete ecosystem for rapid deployment, metadata management, and smart toy platform activation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      HotStack Ecosystem                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   HotStack   │  │   CodeNest   │  │   ToyNest    │
    │  Omnidrop    │  │   Metadata   │  │  User Meta   │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┴─────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ Fruitful Global  │  │   BuildNest      │
         │ Planet Change    │  │   Orchestrator   │
         └──────────────────┘  └──────────────────┘
```

## Components

### 1. HotStack (hotstack.faa.zone)
**Purpose**: Zero-signup intake system with 180-second deployment window

**Features**:
- Omnidrop Protocol for rapid file upload
- Zero-signup access with Collapse identity calculation
- Global hub network (12 deployment stations)
- Real-time status console

**Repository**: `https://github.com/heyns1000/hotstack.git`

### 2. CodeNest
**Purpose**: Unified repository aggregating 80+ repos with metadata management

**Features**:
- Aggregates all Fruitful/HotStack/Banimal repositories
- Provides metadata endpoint for all systems
- Includes Fruitful Global Planet Change integration
- BuildNest orchestrator for chaos generation

**Repository**: `https://github.com/heyns1000/codenest.git`

**Key Subsystems**:
- `repos/fruitfulPlanetChange` - Full-stack platform with PostgreSQL
- `repos/buildnest` - Chaos build system
- `repos/vaultpay` - Payment processing
- `repos/healthtrack` - Metrics tracking

### 3. ToyNest (toynest.faa.zone)
**Purpose**: Smart toys platform with user metadata and brand subdomains

**Features**:
- User metadata core and subnodes
- Brand-specific subdomains (e.g., `lego.toynest.faa.zone`)
- Smart toy activation by user idea
- 9-second metadata sync pulse
- Collapse protocol for user identity

**Repository**: `https://github.com/Heyns100/toynest.seedwave.git`

## Integration Flow

### User Upload Workflow

```
1. USER UPLOAD
   └─> hotstack.faa.zone
       ├─> Drop HTML/PDF file
       └─> Enter prompt/idea

2. IDENTITY CALCULATION
   └─> Collapse Protocol
       ├─> Calculate Payfast User ID
       ├─> Assign User Number (1-2300)
       └─> Generate timestamp-based identity

3. METADATA PULL
   └─> CodeNest Integration
       ├─> Load fruitfulPlanetChange metadata
       ├─> Access sector mappings
       └─> Connect to PostgreSQL database

4. BUILD & DEPLOY
   └─> BuildNest Orchestrator
       ├─> Extract intent from upload
       ├─> Generate site with chaos engine
       └─> Deploy to subdomain

5. TOYNEST ACTIVATION (if toy-related)
   └─> ToyNest System
       ├─> Create user metadata core
       ├─> Initialize subnodes
       ├─> Deploy to {brand}.toynest.faa.zone
       └─> Activate smart toy features
```

## Configuration Files

### codenest-metadata.json
Defines the connection to CodeNest and available sectors:

```json
{
  "codenest": {
    "repository": "https://github.com/heyns1000/codenest.git",
    "integration": "fruitfulPlanetChange",
    "metadata_endpoint": "https://buildnest-orchestrator.heynsschoeman.workers.dev/metadata",
    "sectors": {
      "fruitful": {
        "repo": "repos/fruitfulPlanetChange",
        "api": "/api/fruitful",
        "architecture": "full-stack"
      }
    }
  }
}
```

### toynest-config.json
Defines ToyNest platform configuration:

```json
{
  "toynest": {
    "domain": "toynest.faa.zone",
    "features": {
      "user_metadata": {
        "enabled": true,
        "core_data": ["user_id", "creation_timestamp", "collapse_identity"],
        "subnodes": ["toy_preferences", "interaction_history", "brand_affiliations"]
      },
      "brand_subdomains": {
        "enabled": true,
        "format": "{brand}.toynest.faa.zone"
      }
    }
  }
}
```

## User Metadata Structure

### Core Metadata
```javascript
{
  user_id: "PF-ABC123",           // Calculated from timestamp
  collapse_id: "PF-ABC123",       // Payfast format
  user_number: 1234,              // 1-2300 sector assignment
  creation_time: "2025-12-03T...", // ISO 8601
  sector: "coffee_business"       // Default sector
}
```

### ToyNest Subnodes
```javascript
{
  preferences: {
    toy_types: ["educational", "interactive"],
    age_range: "5-10",
    interests: ["science", "art"]
  },
  interactions: {
    play_sessions: [...],
    achievements: [...],
    milestones: [...]
  },
  brand_data: {
    affiliated_brands: ["lego", "mattel"],
    owned_toys: [...],
    wishlist: [...]
  }
}
```

## API Endpoints

### HotStack
- `POST /api/build` - Upload file and trigger build
- `GET /api/health` - Health check

### CodeNest
- `GET /metadata` - Get system metadata
- `GET /sectors` - List available sectors
- `GET /sectors/:sector` - Get sector details

### ToyNest
- `POST /api/toynest/users` - Create user with metadata
- `GET /api/toynest/users/:id` - Get user metadata
- `PATCH /api/toynest/users/:id/subnodes` - Update subnodes
- `POST /api/toynest/brands/:brand/deploy` - Deploy brand subdomain
- `POST /api/toynest/toys/activate` - Activate smart toy

## Deployment

### HotStack
```bash
# Deploy to Cloudflare Pages
git clone https://github.com/heyns1000/hotstack.git
cd hotstack
wrangler pages deploy . --project-name=hotstack
```

### CodeNest
```bash
# Already deployed at buildnest-orchestrator.heynsschoeman.workers.dev
# Webhook connected to GitHub for automatic builds
```

### ToyNest
```bash
# Deploy brand subdomain
curl -X POST https://api.toynest.faa.zone/brands/lego/deploy \
  -H "Content-Type: application/json" \
  -d '{"template": "default", "features": ["inventory", "user_profiles"]}'
```

## Brand Subdomain Examples

- `lego.toynest.faa.zone` - LEGO smart building blocks
- `mattel.toynest.faa.zone` - Mattel interactive toys
- `hasbro.toynest.faa.zone` - Hasbro games platform
- `fruitful.toynest.faa.zone` - Fruitful educational toys

## Security & Licensing

- **Master License**: HOTSTACK_LICENSE_STATUS = 'MASTERED'
- **Licensing Lock**: Required for deployment
- **Treaty Grid**: Royalty-linked license from Fruitful Global
- **ClaimRoot™**: Secure, traceable site ownership

## Performance

- **Deployment Window**: 180 seconds (3 minutes)
- **Metadata Sync**: 9-second pulse
- **Collapse Interval**: 900ms heartbeat
- **Zero-Signup**: Instant identity generation

## Monitoring

### Live Status Console
Real-time logs available at hotstack.faa.zone showing:
- System initialization
- CodeNest connection status
- ToyNest configuration load
- Metadata sync pulses
- Deployment progress

### Metrics
- Total deployments
- Active users
- Brand subdomains created
- Toy activations
- Metadata operations

## Support

- **HotStack Issues**: https://github.com/heyns1000/hotstack/issues
- **CodeNest Issues**: https://github.com/heyns1000/codenest/issues
- **ToyNest Issues**: https://github.com/Heyns100/toynest.seedwave/issues

## Next Steps

1. ✅ Deploy HotStack with integrated metadata
2. ✅ Connect to CodeNest repository
3. ✅ Enable ToyNest user metadata system
4. ⏳ Create first brand subdomain
5. ⏳ Activate smart toy features
6. ⏳ Scale to production

---

**🦍 SCROLL SEALED | 📜 LATTICE SYNCED | 🔥 GORILLA APPROVED**

*The omni-integration is complete. All systems operational.*
