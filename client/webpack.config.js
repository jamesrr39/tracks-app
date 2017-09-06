module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'dist/bundle.js'
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  }
}
