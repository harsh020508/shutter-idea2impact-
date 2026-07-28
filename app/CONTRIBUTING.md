# Contributing to Shutter

Thank you for your interest in contributing to Shutter, a B2B retail platform for Indian kirana stores.

## Development Setup

### Prerequisites

- Node.js 20 or later
- MySQL database (local or hosted)
- Supabase project for authentication

### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run check` | TypeScript type checking |
| `npm run test` | Run tests |
| `npm run format` | Format code with Prettier |

## Code Style

- **TypeScript**: All code should be strictly typed. Avoid `any` where possible.
- **Formatting**: Prettier is configured. Run `npm run format` before committing.
- **Linting**: ESLint is configured. Run `npm run lint` and fix any errors.
- **Components**: Use functional components with hooks. Follow existing patterns in `src/components/`.
- **API**: Use tRPC routers. Add new procedures to appropriate router files.

## Project Structure

- `api/` - Backend logic (tRPC routers, authentication)
- `db/` - Database schema and migrations
- `src/` - Frontend React components and pages
- `contracts/` - Shared types between frontend and backend

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run linting and tests: `npm run lint && npm run test`
5. Commit your changes with clear messages
6. Push to your fork
7. Open a pull request

### PR Guidelines

- Keep changes focused and atomic
- Add tests for new functionality
- Update documentation if needed
- Reference any related issues

## Reporting Issues

When reporting bugs, please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node version, OS, browser)

## Questions

For questions or discussions, please open an issue with the `question` label.
