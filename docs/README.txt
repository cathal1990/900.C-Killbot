- When the docker container is built, the user is set to "node", not root so it wont be able to write the json files.
    - sudo docker exec -u root -it 2cc33fd927be /bin/sh (to get into the container as root user)
    - chmod 777 ./config for any user to have permissions or chown node:node ./config to give node permissions
    - Container will now have perms to create the json files.

- Can set up the dockerfile to set user to root but unsure how this will effect the rest of the build script

- Environment variables were added by creating a .env file in the root of docker conatiner and adding the variables there. Setting them manually in cli or in the .bash_profile did not work for some reason.

