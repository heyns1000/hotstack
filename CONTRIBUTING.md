# Contributing to HotStack

Thank you for your interest in contributing to HotStack! 🎉

## 🤝 How to Contribute

### Reporting Bugs

Found a bug? Please open an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (browser, OS, etc.)

### Suggesting Features

Have an idea? Open an issue with:

- Feature description
- Use case
- Why it would be valuable
- Proposed implementation (optional)

### Submitting Changes

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/hotstack.git
   cd hotstack
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

4. **Make your changes**
   - Write clear, commented code
   - Follow existing code style
   - Add tests if applicable

5. **Test locally**
   ```bash
   npm install
   npm run dev
   # Test your changes thoroughly
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Use conventional commits (see below)
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Submit!

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/).

Format: `type(scope): description`

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```
feat(upload): add drag and drop support
fix(api): resolve CORS issue on /upload endpoint
docs(readme): update installation instructions
style(ui): improve button hover effects
refactor(storage): optimize R2 bucket operations
test(api): add unit tests for file upload
chore(deps): update wrangler to v3.78.0
```

## 💻 Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Deploy to staging
npm run deploy:staging
```

## 🎨 Code Style

- Use ES6+ features
- Write clear, self-documenting code
- Add comments for complex logic
- Use meaningful variable names
- Keep functions small and focused
- Follow existing patterns

### Example

```javascript
// ✅ Good
async function handleFileUpload(request, env) {
  const formData = await request.formData();
  const file = formData.get('file');
  
  if (!file) {
    return createErrorResponse('No file provided');
  }
  
  return await uploadToR2(file, env);
}

// ❌ Bad
async function h(r, e) {
  const f = await r.formData();
  const fi = f.get('file');
  if (!fi) return new Response('err');
  return await e.HOTSTACK_BUCKET.put(fi.name, await fi.arrayBuffer());
}
```

## 🧪 Testing

- Test your changes locally before submitting
- Add tests for new features
- Ensure existing tests pass
- Test edge cases

```bash
# Run tests
npm test

# Test deployment
npm run deploy:staging
```

## 📚 Documentation

When adding features:

- Update README.md
- Add API documentation
- Include code examples
- Update CHANGELOG.md

## 🔍 Code Review Process

1. Maintainer reviews PR
2. Feedback provided if needed
3. Revisions made
4. Approval given
5. Merge to main
6. Auto-deploy to production

## 🎯 What to Contribute

### Good First Issues

- Documentation improvements
- UI enhancements
- Bug fixes
- Test coverage

### Feature Ideas

- User authentication
- File sharing
- Image processing
- Analytics
- Webhooks
- Batch operations

### Priority Areas

- Security improvements
- Performance optimization
- Error handling
- Test coverage
- Documentation

## 🚫 What Not to Contribute

- Breaking changes without discussion
- Code without tests (for complex features)
- Unrelated changes in single PR
- Changes without proper documentation

## 🌟 Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🆘 Need Help?

- Open a discussion on GitHub
- Ask in pull request comments
- Review existing issues
- Check documentation

## 🙏 Thank You

Every contribution makes HotStack better. We appreciate your time and effort!

---

**Happy Contributing! 🔥**
