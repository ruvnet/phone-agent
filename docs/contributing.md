# Contributing Guide

This guide provides information for contributors who want to help improve the Phone Agent project.

## Getting Started

### Prerequisites

Before you begin contributing, ensure you have:

- A GitHub account
- Git installed on your local machine
- Node.js 18 or later installed
- npm or yarn package manager
- Basic knowledge of TypeScript and JavaScript
- Familiarity with serverless functions and Cloudflare Pages (helpful but not required)

### Setting Up the Development Environment

1. **Fork the Repository**

   Start by forking the repository to your GitHub account.

2. **Clone Your Fork**

   ```bash
   git clone https://github.com/yourusername/phone-agent.git
   cd phone-agent
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Set Up Environment Variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your development credentials.

5. **Run the Setup Script**

   ```bash
   npm run setup
   ```

6. **Verify Setup**

   ```bash
   npm test
   npm run dev
   ```

   The development server should start at http://localhost:8788.

## Contribution Workflow

### Finding Issues to Work On

1. Check the [Issues](https://github.com/yourusername/phone-agent/issues) tab for open issues
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on an issue to express your interest before starting work
4. If you have a new idea, create a new issue to discuss it before implementing

### Creating a Branch

Create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

Use a descriptive branch name that reflects the changes you're making:
- `feature/new-feature-name` for new features
- `fix/bug-description` for bug fixes
- `docs/documentation-update` for documentation changes
- `refactor/component-name` for code refactoring

### Making Changes

1. Make your changes following the project's coding standards
2. Write or update tests for your changes
3. Ensure all tests pass:

   ```bash
   npm test
   ```

4. Format your code:

   ```bash
   npm run format
   ```

5. Check for linting issues:

   ```bash
   npm run lint
   ```

### Committing Changes

Follow these guidelines for commit messages:

1. Use the present tense ("Add feature" not "Added feature")
2. Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
3. Limit the first line to 72 characters or less
4. Reference issues and pull requests after the first line
5. Use a conventional commit format:

   ```
   <type>(<scope>): <subject>

   <body>

   <footer>
   ```

   Where `<type>` is one of:
   - `feat`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation changes
   - `style`: Changes that don't affect code functionality (formatting, etc.)
   - `refactor`: Code changes that neither fix bugs nor add features
   - `test`: Adding or updating tests
   - `chore`: Changes to the build process or auxiliary tools

   Example:

   ```
   feat(webhook): add signature verification for Bland.ai webhooks

   Implement HMAC-SHA256 signature verification for incoming webhooks from Bland.ai.
   This improves security by ensuring webhooks are authentic.

   Closes #123
   ```

### Pushing Changes

Push your changes to your fork:

```bash
git push origin feature/your-feature-name
```

### Creating a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template with:
   - A clear title
   - A detailed description of your changes
   - References to any related issues
   - Any special instructions for testing
5. Submit the pull request

### Code Review Process

After submitting a pull request:

1. Maintainers will review your code
2. Automated tests will run on your PR
3. You may receive feedback requesting changes
4. Make any requested changes and push to the same branch
5. Once approved, a maintainer will merge your PR

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Define interfaces for all data structures
- Use proper type annotations
- Avoid using `any` type when possible
- Use async/await for asynchronous code

### Naming Conventions

- **Files**: Use kebab-case for filenames (e.g., `webhook-handler.ts`)
- **Classes**: Use PascalCase for class names (e.g., `EmailService`)
- **Interfaces**: Use PascalCase with a descriptive name (e.g., `WebhookPayload`)
- **Functions**: Use camelCase for function names (e.g., `sendEmail`)
- **Variables**: Use camelCase for variable names (e.g., `userEmail`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (e.g., `MAX_RETRY_COUNT`)

### Code Formatting

The project uses Prettier for code formatting:

- 2 spaces for indentation
- Single quotes for strings
- Semicolons at the end of statements
- No trailing commas
- 80 character line length limit

### Code Organization

- Keep files focused on a single responsibility
- Group related functionality in the same directory
- Use clear, descriptive names for files and directories
- Follow the existing project structure

## Testing Guidelines

### Writing Tests

- Write tests for all new functionality
- Update tests when modifying existing functionality
- Aim for high test coverage
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

### Types of Tests

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete workflows

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Documentation Guidelines

### Code Documentation

- Use JSDoc comments for functions and classes
- Document parameters, return values, and thrown errors
- Include examples where appropriate
- Keep comments up-to-date with code changes

Example:

```typescript
/**
 * Verifies the signature of a webhook payload
 * 
 * @param payload - The webhook payload as a string
 * @param signature - The signature from the webhook header
 * @param timestamp - The timestamp from the webhook header
 * @param secret - The webhook signing secret
 * @returns An object indicating if the signature is valid and any error message
 * 
 * @example
 * const result = verifyWebhookSignature(
 *   '{"type":"email.sent"}',
 *   'abcdef1234567890',
 *   '1617304891',
 *   'whsec_abcdef'
 * );
 * 
 * if (result.isValid) {
 *   // Process the webhook
 * } else {
 *   // Reject the webhook
 * }
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): { isValid: boolean; error?: string } {
  // Implementation
}
```

### Markdown Documentation

- Use clear, concise language
- Include examples and code snippets
- Use proper Markdown formatting
- Organize content with headings and lists
- Keep documentation up-to-date with code changes

## Pull Request Guidelines

### PR Checklist

Before submitting a pull request, ensure:

- [ ] Code follows the project's coding standards
- [ ] Tests have been added or updated
- [ ] All tests pass
- [ ] Documentation has been updated if necessary
- [ ] Code has been formatted and linted
- [ ] PR has a descriptive title and description
- [ ] PR references any related issues

### PR Template

```markdown
## Description

[Describe the changes you've made]

## Related Issues

[Reference any related issues, e.g., "Fixes #123"]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Test update
- [ ] Build/CI update
- [ ] Other (please describe)

## Testing

[Describe how you tested your changes]

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have added or updated tests
- [ ] All tests pass
- [ ] I have updated documentation if necessary
- [ ] My changes don't introduce new warnings or errors
```

## Issue Guidelines

### Creating Issues

When creating a new issue:

1. Use a clear, descriptive title
2. Provide detailed information about the issue
3. Include steps to reproduce (for bugs)
4. Include expected and actual behavior (for bugs)
5. Include screenshots or code snippets if relevant
6. Use appropriate labels

### Issue Template

```markdown
## Description

[Describe the issue or feature request]

## Steps to Reproduce (for bugs)

1. [First step]
2. [Second step]
3. [And so on...]

## Expected Behavior

[What you expected to happen]

## Actual Behavior

[What actually happened]

## Environment

- OS: [e.g., Windows 10, macOS 12.0]
- Node.js version: [e.g., 18.12.0]
- npm version: [e.g., 8.19.2]
- Browser (if relevant): [e.g., Chrome 108]
```

## Release Process

### Versioning

The project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Release Workflow

1. Update the version in `package.json`
2. Update the CHANGELOG.md file
3. Create a new release on GitHub
4. Tag the release with the version number
5. Publish to npm if applicable

## Community Guidelines

### Code of Conduct

All contributors are expected to adhere to the project's Code of Conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- No harassment or discrimination
- Respect differing viewpoints and experiences
- Gracefully accept constructive criticism

### Communication Channels

- **GitHub Issues**: For bug reports, feature requests, and discussions
- **Pull Requests**: For code contributions and reviews
- **Discussions**: For general questions and community discussions

## Getting Help

If you need help with contributing:

1. Check the documentation
2. Look for similar issues or discussions
3. Ask questions in the discussions section
4. Reach out to maintainers

## Recognition

Contributors will be recognized in:

- The CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to the Phone Agent project!