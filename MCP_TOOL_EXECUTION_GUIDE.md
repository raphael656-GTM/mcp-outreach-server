# Outreach MCP Tool Execution Guide

## 🔧 **Available MCP Tools**

### **Sequence Management**
- `find_sequence` - Find existing sequences by name
- `create_sequence` - Create new sequence container
- `get_sequences` - List all sequences

### **Template Management**  
- `create_sequence_template` - Create email templates
- `get_sequence_templates` - List all templates
- `find_sequence_template` - Find template by name

### **Step Management**
- `create_sequence_step` - Add steps to sequences
- `get_sequence_steps` - Get steps for a sequence
- `link_template_to_step` - Connect template to step

### **Prospect Management**
- `create_prospect` - Create new prospect
- `search_prospects` - Find existing prospects
- `add_prospect_to_sequence` - Enroll prospect in sequence

### **Bulk Operations**
- `bulk_create_prospects` - Create multiple prospects at once
- `bulk_create_sequences` - Create multiple sequences
- `bulk_create_templates` - Create multiple templates
- `bulk_enroll_prospects` - Enroll multiple prospects

### **System Tools**
- `get_mailboxes` - List available mailboxes
- `health_check` - Check MCP server status
- `get_performance_metrics` - Get server performance data

## 📋 **Tool Execution Format**

Each tool follows this format:

```
[tool_name]
{
  "parameter1": "value1",
  "parameter2": "value2"
}
```

## 🎯 **Core Workflow Tools**

### **1. Check Sequence Exists**
```
find_sequence
{
  "name": "Sequence Name Here"
}
```

### **2. Create Sequence**
```
create_sequence
{
  "name": "Sequence Name",
  "description": "Sequence description",
  "tags": ["tag1", "tag2"],
  "shareType": "shared"
}
```
*Returns: sequence ID*

### **3. Create Email Template**
```
create_sequence_template
{
  "name": "Template Name",
  "subject": "Email subject with {{first_name}}",
  "bodyHtml": "<![CDATA[Email content with {{first_name}} and {{account.name}}]]>",
  "tags": ["tag1", "tag2"],
  "trackLinks": true,
  "trackOpens": true
}
```
*Returns: template ID*

### **4. Create Sequence Step**
```
create_sequence_step
{
  "sequenceId": "sequence_id_from_step_2",
  "stepType": "auto_email",
  "order": 1,
  "intervalInDays": 0
}
```
*Returns: step ID*

### **5. Link Template to Step**
```
link_template_to_step
{
  "sequenceStepId": "step_id_from_step_4",
  "templateId": "template_id_from_step_3"
}
```

### **6. Create Prospect**
```
create_prospect
{
  "firstName": "First",
  "lastName": "Last", 
  "email": "email@company.com",
  "company": "Company Name",
  "title": "Job Title"
}
```
*Returns: prospect ID*

### **7. Enroll Prospect in Sequence**
```
add_prospect_to_sequence
{
  "prospectId": "prospect_id_from_step_6",
  "sequenceId": "sequence_id_from_step_2"
}
```

## 🚀 **Bulk Operations**

### **Bulk Create Multiple Prospects**
```
bulk_create_prospects
{
  "prospects": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com",
      "company": "Company A",
      "title": "CEO"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith", 
      "email": "jane@company.com",
      "company": "Company B",
      "title": "CTO"
    }
  ],
  "options": {
    "batchSize": 25,
    "continueOnError": true
  }
}
```

### **Bulk Create Multiple Templates**
```
bulk_create_templates
{
  "templates": [
    {
      "name": "Template 1",
      "subject": "Subject 1 with {{first_name}}",
      "bodyHtml": "<![CDATA[Content 1 with {{first_name}}]]>",
      "tags": ["campaign1"]
    },
    {
      "name": "Template 2", 
      "subject": "Subject 2 with {{first_name}}",
      "bodyHtml": "<![CDATA[Content 2 with {{account.name}}]]>",
      "tags": ["campaign1"]
    }
  ]
}
```

### **Bulk Enroll Prospects**
```
bulk_enroll_prospects
{
  "enrollments": [
    {
      "prospectId": "123",
      "sequenceId": "456"
    },
    {
      "prospectId": "789", 
      "sequenceId": "456"
    }
  ]
}
```

## 🔍 **Search and List Tools**

### **Find Existing Prospects**
```
search_prospects
{
  "email": "john@company.com"
}
```

### **List All Sequences**
```
get_sequences
{
  "limit": 50
}
```

### **Get Available Mailboxes**
```
get_mailboxes
{}
```

## 📊 **Monitoring Tools**

### **Check Server Health**
```
health_check
{}
```

### **Get Performance Metrics**
```
get_performance_metrics
{
  "includeDetails": true
}
```

### **Get Cache Statistics**
```
get_cache_stats
{}
```

## ⚡ **Key Parameters**

### **Required Fields:**
- **Prospects**: firstName, lastName, email
- **Sequences**: name
- **Templates**: name, subject
- **Steps**: sequenceId
- **Linking**: sequenceStepId, templateId

### **Common Parameters:**
- **shareType**: "shared" (recommended for team visibility)
- **stepType**: "auto_email" (for automated emails)
- **trackLinks/trackOpens**: true (for analytics)
- **intervalInDays**: 0, 3, 4, 5 (typical timing)

### **Personalization Variables:**
- `{{first_name}}` - Prospect's first name
- `{{account.name}}` - Company name
- `{{sender.firstName}}` - Sender's first name

### **HTML Formatting:**
- Wrap HTML content in `<![CDATA[...]]>`
- Use `<br>` for line breaks
- Use `<b>` for bold text

## 🎯 **Simple Execution Sequence**

1. **find_sequence** → Check if exists
2. **create_sequence** → Get sequence ID  
3. **create_sequence_template** → Get template ID (repeat for each email)
4. **create_sequence_step** → Get step ID (repeat for each step)
5. **link_template_to_step** → Connect each template to its step
6. **create_prospect** → Get prospect ID (or use bulk_create_prospects)
7. **add_prospect_to_sequence** → Enroll prospect

**Result**: Complete working sequence with prospects enrolled and ready to execute.