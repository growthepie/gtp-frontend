## Building and running

### Local Development

To get the development server running on your local machine, follow these steps:

1.  **Install dependencies:**
    ```bash
    yarn install
    ```

2.  **Run the development server:**
    This will start the Next.js application, typically on `http://localhost:3000`.
    ```bash
    yarn dev
    ```

### Pre-submission Checks

Before submitting a Pull Request, it is crucial to validate your changes by running the full suite of local checks. This ensures your code is formatted correctly, free of linting errors, and builds successfully.

```bash
# Run ESLint to check for code quality and style issues
yarn lint

# Run a production build to ensure there are no compilation errors
yarn build
```

## Git Repo

The main branch for this project is `main`. Feature development should happen on separate branches and be merged via Pull Requests.

## Technology Stack

The `gtp-frontend` is a modern web application built with the following core technologies:

-   **Framework**: **Next.js** (built on **React**)
-   **Language**: **TypeScript**
-   **Styling**: **Tailwind CSS** for utility-first styling. The canonical design source is **Figma**.
-   **Data Fetching**: **SWR** for efficient, cached data fetching from the `gtp-backend` API.
-   **State Management**: A combination of local component state (`useState`), React Context (`createContext`), and `usehooks-ts` for browser storage.
-   **Charting**: **Highcharts** and **ECharts** for interactive data visualizations.
-   **Deployment**: Hosted and deployed via **Vercel**.

## Core Principles & Code Style

-   **Guiding Philosophy**: Our goal is to write **accurate, reliable, and maintainable** code to power a transparent and digestible on-chain analytics platform.
-   **Formatting & Linting**: Code style is strictly enforced by **Prettier** and **ESLint**. All code must be formatted and pass linting checks before merging. The configuration is optimized for Next.js and Tailwind CSS.
-   **Naming Conventions**:
    -   **React Components**: `PascalCase` (e.g., `FundamentalsTracker`).
    -   **Variables & Functions**: `camelCase` (e.g., `fetchChartData`).
    -   **Files**: Component files should be `PascalCase` (e.g., `ChainSelector.tsx`). Utility and config files can be `camelCase`.

## Frontend Development (React & Next.js)

### Component Design

-   **Modularity**: Build small, reusable components with a single responsibility. Organize components logically within the `components/` directory (e.g., `components/charts`, `components/layout`).
-   **Composition**: Favor composition over inheritance. Build complex UIs by combining simpler components.
-   **Type Safety**: Leverage **TypeScript** for all components. Define explicit types for component `props` to ensure clarity and prevent bugs. API response types are defined in the `types/api/` directory and should be used wherever that data is handled.

### React Hooks

-   Use functional components and Hooks for all new development.
-   Manage side effects (like manual DOM manipulation or subscriptions) within `useEffect`, ensuring correct dependency arrays.
-   Use `useMemo` and `useCallback` sparingly and only when there is a clear, measured performance benefit.

## State Management

Follow a clear hierarchy for managing state to keep the application predictable and performant:

1.  **Local Component State (`useState`)**: Use for state that is only relevant to a single component (e.g., a modal's open/close status). This is the default choice.
2.  **Persistent UI State (`usehooks-ts`)**: Use `useLocalStorage` or `useSessionStorage` for user preferences that need to persist across sessions (e.g., dark mode toggle, selected filters).
3.  **Global App State (`React Context`)**: Use for state that needs to be shared across many components at different levels of the tree (e.g., `UIContext`, `MasterContext`). Avoid putting frequently-changing data in a global context to prevent unnecessary re-renders.

## Styling (Tailwind CSS & Figma)

-   **Primary Method**: All styling should be done using **Tailwind CSS** utility classes directly in the JSX.
-   **Design Source of Truth**: **Figma** is the canonical source for all UI/UX design. Implement components and layouts to match the specifications in Figma.
-   **Theme**: The application currently supports a **dark mode only**.
-   **Custom CSS**: Avoid writing custom CSS files. If a complex style cannot be achieved with Tailwind, consider a component-scoped CSS Module (`*.module.css`) as a last resort.

## Data Fetching (SWR)

-   **Backend Responsibility**: The `gtp-frontend` is a presentation layer. All heavy data processing, aggregation, and normalization is handled by the `gtp-backend`. The frontend's role is to consume this pre-processed JSON data.
-   **Client-side Fetching**: This project uses **SWR** for all data fetching from the `gtp-backend` API.
-   **SWR Best Practices**:
    -   Leverage SWR's built-in caching and revalidation to ensure data is fresh without manual polling.
    -   Handle loading and error states gracefully using the data returned from the `useSWR` hook.
    -   Create reusable data-fetching hooks (e.g., `useFundamentalsData`) to encapsulate SWR logic and make it available to multiple components.

## Comments policy

Only write comments to explain the "why" behind a complex or non-obvious piece of code. Do not write comments that explain the "what"—the code itself should be self-explanatory.