# Release Process

This document describes the automated release process for the SLO Calculator.

## Overview

We use [tagpr](https://github.com/Songmu/tagpr) to automate our release process. When changes are merged to the `main` branch, tagpr automatically:

1. Creates a release PR with updated version and changelog
2. After the PR is merged, creates a git tag
3. The tag triggers our NPM publish workflow

## Prerequisites

### 1. NPM Token Setup

You need to set up an NPM automation token in GitHub Secrets:

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to Access Tokens in your account settings
3. Generate a new automation token
4. Add it to your GitHub repository secrets as `NPM_TOKEN`:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM token

### 2. Package Configuration

Ensure your `package.json` has the correct configuration:

```json
{
  "name": "@your-scope/slo-calculator",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

## Release Flow

### 1. Automatic Release PR Creation

When changes are pushed to `main`, tagpr will:

- Detect conventional commits
- Update version in `package.json`
- Update `CHANGELOG.md`
- Create a PR with these changes

### 2. Review and Merge

1. Review the automatically created PR
2. Ensure all changes are correct
3. Verify version bump is appropriate
4. Merge the PR

### 3. Automatic Publication

After merging the release PR:

1. tagpr creates a git tag (e.g., `v1.0.1`)
2. The tag triggers the NPM publish workflow
3. The package is published to NPM with provenance
4. A GitHub release is created

## Manual Release (Emergency)

If you need to publish manually:

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Update version
npm version patch  # or minor, major

# Push changes and tag
git push origin main --follow-tags

# The tag will trigger the automated publish
```

## Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.X): Bug fixes, minor updates
- **MINOR** (1.X.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes

## Troubleshooting

### NPM Publish Fails

1. Check the GitHub Actions logs
2. Verify NPM_TOKEN is set correctly
3. Ensure package.json version matches the git tag
4. Check NPM account permissions

### tagpr Not Creating PR

1. Ensure tagpr workflow has correct permissions
2. Check if there are actually new commits since last release
3. Verify branch protection rules allow PR creation

### Version Mismatch

The publish workflow verifies that the git tag matches package.json version. If they don't match:

1. Manually update package.json to match the tag
2. Or delete the tag and let tagpr recreate it

## Best Practices

1. **Use Conventional Commits**: This helps tagpr determine version bumps

   - `fix:` → patch
   - `feat:` → minor
   - `BREAKING CHANGE:` → major

2. **Review Release PRs**: Always review the automated PR before merging

3. **Test Before Release**: Ensure all tests pass before merging release PR

4. **Monitor Releases**: Check NPM and GitHub releases after merge

## Security

- NPM tokens should use automation tokens, not publish tokens
- Enable 2FA on NPM account
- Use NPM provenance for supply chain security
- Regularly rotate tokens

## Rollback

If a bad version is published:

1. Deprecate the version on NPM:

   ```bash
   npm deprecate @your-scope/slo-calculator@1.0.1 "Critical bug, use 1.0.2"
   ```

2. Publish a fix immediately

3. Note: NPM packages cannot be unpublished after 72 hours
