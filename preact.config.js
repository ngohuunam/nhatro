export default (config, env, helpers) => {
  if (env.production === true) {
    helpers
      .getPluginsByName(config, 'UglifyJsPlugin')
      .map(e => e.plugin)
      .forEach(plugin => {
        plugin.options.sourceMap = false
        plugin.options.comments = false
        plugin.options.compress.drop_console = true
      })
  }
}
