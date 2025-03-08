const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const sass = require('sass')
const webpack = require('webpack')

module.exports = (env, argv) => {
  const { mode } = argv
  const additionalPlugins = mode === 'production'
    ? []
    : [new webpack.HotModuleReplacementPlugin()] // Enable hot module replacement

  const additionalEntries = mode === 'production' ? [] : ['webpack-hot-middleware/client?http://localhost:8000']

  return {
    mode,
    entry: [
      '@babel/polyfill', // so we don't need to import it anywhere
      './client/main.jsx',
      ...additionalEntries,
    ],
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        Utilities: path.resolve(__dirname, 'client/util/'),
        Components: path.resolve(__dirname, 'client/components/'),
        Assets: path.resolve(__dirname, 'client/assets/'),
        '@root': path.resolve(__dirname),
      },
    },
    module: {
      rules: [
        {
          // Load JS|JSX files
          test: /\.(jsx|js)$/,
          include: path.resolve(__dirname, 'client'),
          exclude: /node_modules/,
          use: [{
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: 'defaults',
                }],
                '@babel/preset-react',
              ],
            },
          }],
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          // Load other files
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          use: ['file-loader'],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.BUILT_AT': JSON.stringify(new Date().toISOString()),
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      // Skip the part where we would make a html template
      new HtmlWebpackPlugin({
        template: 'index.html',
        favicon: path.resolve(__dirname, 'client/assets/favicon-32x32.png'),
      }),
      new webpack.ProvidePlugin({
        React: 'react',
      }),
      ...additionalPlugins,
    ],
  }
}
