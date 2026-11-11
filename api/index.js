// Vercel function for every /api/* request (see vercel.json rewrites). The real code is in server/;
// it is compiled to server/dist during the Vercel build.
export { default } from '../server/dist/vercel.js'
