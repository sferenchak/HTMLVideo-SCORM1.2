const path = require('path');

module.exports = {
	entry: {
		contentfunctions: './src/contentfunctions.js'
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist/js')
	},
	module: {
		rules: [
			{
				test: /contentfunctions\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	}
};
