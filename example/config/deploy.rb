lock "3.4.0" # valid only for current version of Capistrano

set :application, "react-inline-demo"
set :log_level, :debug
set :keep_releases, 3

set :repo_url, "git@github.com:martinandert/react-inline.git"
set :repo_tree, "example"

set :buildpack_url, "https://github.com/heroku/heroku-buildpack-nodejs.git#v75"
set :foreman_options, port: 3011, user: "deploy"
set :default_env, npm_config_production: "false", node_env: "production"
