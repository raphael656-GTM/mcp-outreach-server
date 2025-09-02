# Outreach OAuth Scope Update Guide

## Current Issue
The MCP server is missing critical OAuth scopes for full sequence creation functionality.

## Required OAuth Scopes
Add these scopes to your Outreach OAuth application:

```
sequences.read
sequences.write  
templates.read
templates.write
sequenceTemplates.read
sequenceTemplates.write  ← CRITICAL for template linking
prospects.read
prospects.write
sequenceStates.read
sequenceStates.write
mailings.read
```

## How to Update OAuth Scopes

### Step 1: Access Outreach Developer Settings
1. Go to Outreach → Settings → API & Webhooks
2. Find your OAuth application 
3. Edit the application settings

### Step 2: Update Scope Permissions
Add the missing scopes listed above, particularly:
- `sequenceTemplates.write`
- `sequences.write` 
- `templates.write`

### Step 3: Re-authorize the Application
After updating scopes, you need to:
1. Generate new authorization URL with updated scopes
2. Complete OAuth flow again
3. Get new refresh token with enhanced permissions

### Step 4: Test the Enhanced Permissions
Use the MCP tools to verify template linking now works:
```bash
create_sequence_template(sequenceStepId: 12487, templateId: 14326)
```

## Alternative: Request Admin Permissions
If you don't have access to OAuth settings:
1. Contact your Outreach administrator
2. Request the additional scopes listed above
3. Explain the need for automated sequence template linking

## Verification
After scope update, test these operations:
- ✅ Template creation
- ✅ Sequence creation  
- ✅ Sequence step creation
- ✅ **Template linking** ← This should now work
- ✅ Bulk sequence creation