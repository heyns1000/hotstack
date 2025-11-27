# HotStack Deployment Instructions

## Quick Deploy

```bash
cd /home/user/buildnest/.tmp/hotstack-deploy
git init
git add .
git commit -m "Deploy HotStack v2.0 template from samfox"
git branch -M main
git remote add origin https://github.com/heyns1000/hotstack.git
git push -u origin main --force
```

## Verify Deployment

After pushing, verify at:
- https://hotstack.faa.zone
- https://github.com/heyns1000/hotstack

## Update Template

To update the template in the future:

```bash
# Fetch latest template
curl -s https://raw.githubusercontent.com/heyns1000/samfox/main/public/global_templates/hotstack_vs2.0.html -o index.html

# Commit and push
git add index.html
git commit -m "Update HotStack template"
git push origin main
```

## Integration with BuildNest

The HotStack landing page integrates with BuildNest backend:

1. User uploads file via drag & drop
2. Cloudflare Worker validates and stores in R2
3. Queue triggers BuildNest processing
4. BuildNest generates project with real data
5. CodeNest receives polished output
6. ClaimRoot™ license generated
7. Deployment confirmation sent

## Template Preservation

The HTML template is preserved UNCHANGED from samfox repository.
No modifications, no transpilation, no minification.

## Support

For issues or updates, contact the BuildNest team or reference:
- Template Source: heyns1000/samfox
- Backend: heyns1000/buildnest
- Manual: https://github.com/heyns1000/samfox/blob/main/public/global_templates/hotstack/hotstack_manual.md
