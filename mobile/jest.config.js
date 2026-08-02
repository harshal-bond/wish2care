const path = require('path');

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    // Force every consumer (including deep inside node_modules, e.g.
    // @tanstack/react-query, @testing-library/react-native) onto the same
    // single React/react-test-renderer copy that mobile's own devDependency
    // pins — the workspace hoists a newer patch for other workspaces
    // (frontend), so without this, Jest's plain Node resolution (unlike
    // Metro's, which mobile/metro.config.js already special-cases for this
    // monorepo) can load two different React instances and crash with
    // "Invalid hook call".
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
    '^react-test-renderer$': require.resolve('react-test-renderer'),
    // @wish2care/shared is ESM-only with no "require" export condition, so
    // Jest's CJS-based resolver can't find it via plain `require()`; point
    // straight at its built output (same file Metro already resolves via
    // its "exports" support).
    '^@wish2care/shared$': path.resolve(__dirname, '../shared/dist/index.js'),
  },
};
