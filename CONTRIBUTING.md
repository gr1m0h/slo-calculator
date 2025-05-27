# Contributing to SLO Calculator

Thank you for your interest in contributing to SLO Calculator! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, nationality, or any other characteristic.

### Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- The use of sexualized language or imagery and unwelcome sexual attention
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git
- TypeScript knowledge (recommended)

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/your-username/slo-calculator.git
   cd slo-calculator
   ```

3. Add the upstream repository:

   ```bash
   git remote add upstream https://github.com/original-org/slo-calculator.git
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Create a branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Process

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/prometheus-integration`)
- `fix/` - Bug fixes (e.g., `fix/calculation-overflow`)
- `docs/` - Documentation updates (e.g., `docs/improve-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/command-structure`)
- `test/` - Test additions or fixes (e.g., `test/error-budget-calc`)

### Development Workflow

1. **Make your changes**

   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

2. **Test your changes**

   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm test -- --watch

   # Run specific test file
   npm test -- src/core/SLOCalculator.test.ts
   ```

3. **Lint and format your code**

   ```bash
   # Check for linting errors
   npm run lint

   # Auto-fix linting issues
   npm run lint -- --fix

   # Format code
   npm run format
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Test the CLI locally**

   ```bash
   # Run the development version
   npm run dev -- init

   # Or link and test the built version
   npm link
   slo-calc --help
   ```

## Pull Request Process

### Before Submitting

1. **Update your branch with the latest upstream changes**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Ensure all tests pass**

   ```bash
   npm test
   npm run lint
   npm run build
   ```

3. **Update documentation**
   - Update README.md if you've added new features
   - Add JSDoc comments for new functions/classes
   - Update CLI help text if adding new commands

### Submitting a Pull Request

1. Push your changes to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the GitHub page and create a new Pull Request

3. Fill out the PR template with:

   - Clear description of the changes
   - Related issue numbers (if any)
   - Screenshots/examples (if applicable)
   - Breaking changes (if any)

4. Wait for review and address any feedback

### PR Review Process

- All PRs require at least one review before merging
- CI checks must pass (tests, linting, build)
- Reviewers will check for:
  - Code quality and style consistency
  - Test coverage
  - Documentation updates
  - Breaking changes
  - Performance implications

## Style Guidelines

### TypeScript Style

```typescript
// Use explicit types for function parameters and return values
function calculateSLI(data: SLIData[]): number {
  // Implementation
}

// Use interfaces for data structures
interface Config {
  target: number;
  window: number;
}

// Use enums for constants
enum Status {
  Healthy = "HEALTHY",
  Warning = "WARNING",
  Critical = "CRITICAL",
}

// Document public APIs with JSDoc
/**
 * Calculates the error budget for a given SLO
 * @param currentSLI - Current SLI value (0-1)
 * @param targetSLO - Target SLO value (0-1)
 * @param windowDays - Window size in days
 * @returns Error budget metrics
 */
export function calculateErrorBudget(
  currentSLI: number,
  targetSLO: number,
  windowDays: number,
): ErrorBudget {
  // Implementation
}
```

### General Guidelines

- Use meaningful variable and function names
- Keep functions small and focused (single responsibility)
- Prefer composition over inheritance
- Handle errors gracefully with try-catch blocks
- Use async/await over callbacks
- Add comments for complex logic
- Avoid magic numbers - use named constants

### Commit Message Format

Follow the conventional commits specification:

```
type(scope): subject

body

footer
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

Examples:

```
feat(commands): add export command for reports
fix(calc): correct error budget calculation for edge cases
docs(readme): update installation instructions
```

## Testing

### Writing Tests

- Place test files next to the code they test
- Name test files with `.test.ts` suffix
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

Example test:

```typescript
// src/core/SLOCalculator.test.ts
import { SLOCalculator } from "./SLOCalculator";

describe("SLOCalculator", () => {
  describe("calculateSLO", () => {
    it("should calculate SLO correctly with valid data", async () => {
      // Arrange
      const calculator = new SLOCalculator();
      const testData = [
        { date: "2024-01-01", totalRequests: 1000, successfulRequests: 999 },
      ];

      // Act
      const result = await calculator.calculateSLO("test-service", {
        name: "test-service",
        target: 0.999,
        window: 1,
      });

      // Assert
      expect(result.adjustedSLI).toBe(0.999);
    });
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- Test edge cases and error conditions
- Include integration tests for CLI commands
- Mock external dependencies (file system, network calls)

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Include parameter descriptions and return types
- Add usage examples for complex functions

### README Updates

When adding new features:

- Update the feature list
- Add command documentation
- Include usage examples
- Update the architecture section if needed

### API Documentation

For significant API changes:

- Update type definitions
- Document breaking changes
- Provide migration guides

## Community

### Getting Help

- Check existing issues and PRs first
- Ask questions in discussions
- Join our community chat (if available)
- Tag maintainers for urgent issues

### Reporting Issues

When reporting issues, include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, Node version)
- Error messages and stack traces
- Sample data (if applicable)

### Feature Requests

For feature requests:

- Check if it's already requested
- Explain the use case
- Provide examples
- Consider implementing it yourself!

## Recognition

Contributors will be:

- Listed in the project's contributors section
- Mentioned in release notes
- Given credit in commit messages

Thank you for contributing to SLO Calculator! Your efforts help make reliability engineering better for everyone.
