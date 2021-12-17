# Steps to build and run the project

## 1. Build all the containers by running the following command in the right folder
 - `docker build -t buffer .`
 - `docker build -t consumption .`
 - `docker build -t modelledprice .`
 - `docker build -t price .`
 - `docker build -t windspeed .`
 - `docker build -t powerplant .`
 - `docker build -t producer .`
 - `docker build -t hemsida .`

## 2. Deploy the application by running the following command in the temp folder.
 - `docker-compose up`

# Steps do update services
## 1. Create the changes you want to deploy.
## 2. Rebuild the docker container by running for example `docker build -t hemsida .`
## 3. Update the container that is used by docker-compose. This can be done either by stopping the service in docker hub and then starting it again (the container that was build the latest will be used when starting it again). The alternative is to stop the deployment and then restart it with the command `docker-compose up` in the temp folder

### Extra notes:
The docker-compose deployment is currently exposing the services through the same ports as we have defined in the express apps. If one would like the make a lot of changes to a specific service it might be better to not use that service in the docker-compose file (comment out the field concerning the service) and instead start the service with `npm start`.