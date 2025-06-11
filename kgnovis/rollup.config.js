import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-import-css';
import url from '@rollup/plugin-url';
import json from '@rollup/plugin-json';

export default {
  input: 'vis_components/index.js',
  output: {
    file: 'dist/kgnovis.bundle.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    css(),
    url({
      include: ['**/*.png', '**/*.jpg', '**/*.svg'],
      limit: 0,
      fileName: '[name][hash][extname]',
      destDir: 'dist/assets'
    }),
    json(),
    resolve(),   
    commonjs(), 
  ]
};
