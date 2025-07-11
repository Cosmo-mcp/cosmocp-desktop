# cosmocp-desktop

The application here is made from Electron and Angular. Electron runs in NodeJS on the main process and Angular runs in Render process. 
The files for both the framework are mixed. 
In order to differentiate the source files, I renamed angular application to web-app. 

`src` folder contains electron code

`web-app` folder contains angular code

`main.ts` file inside `src` is updated to include angular dev url `localhost:4200` (we need to find a proper way to handle this for dev and prod)

For creating UI, you can run just angular application with command `npm run web-app:serve`

For desktop development, you need to run both angular dev server and also electron dev server, the commands can be found in `package.json`
