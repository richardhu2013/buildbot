#!/bin/bash
# sudo apt-get update
# sudo apt-get upgrade -y
sudo apt-get -y install git vim curl
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.4/install.sh | bash

source ~/.nvm/nvm.sh
nvm install v5
nvm alias default v5
npm install grunt-cli -g

npm install

