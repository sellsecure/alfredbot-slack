# HOW TO Running Alfred as an init.d Service

## install forever
> sudo npm install -g forever

## Created log folder
> sudo mkdir /var/run/forever

## Copy service file (as root)
> cp daemonize/Alfred /etc/init.d/Alfred
> chmod a+x /etc/init.d/Alfred
> update-rc.d Alfred defaults

## Start Alfred Service
> service Alfred start

## Stop Alfred Service
> service Alfred stop
