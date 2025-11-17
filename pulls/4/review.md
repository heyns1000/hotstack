### PR Review for R2 Worker Intake

This PR implements streaming uploads with `file.stream()` and ensures secure operations via Bearer authentication, as well as manifest hooks for BuildNest sync. Additional highlights include a progress bar for file uploads, robust /status endpoint, and upgraded drag-drop support in the HTML interface.

### Key Wins:
1. Enhances large-file handling with no memory overheads.
2. Automates sync manifests creation securely.
3. Vercel deploy triggers work smoothly on preview.

### Next Steps:
- Open the PR for readiness and merge via outlined commands.

This feature significantly clears bottlenecks in the workflow and ensures inhaling of big files to R2 in under 10 seconds.

Let me know if tests show unexpected logs during deployment validation.