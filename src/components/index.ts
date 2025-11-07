// Root barrel export for all components

// Re-export from subdirectories that have index files
export * from '@components/feedback';
export * from '@components/form';
export * from '@components/language';
export * from '@components/multiChannel';

// Export root-level components
export { default as ServicesGrid } from '@components/ServicesGrid';
export { default as StatCard } from '@components/StatCard';
export { default as Welcome } from '@components/Welcome';

// Note: dashboard, modals, and ui subdirectories don't have index files
// Import directly from those subdirectories when needed
